import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { IkuRecord } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { ikuDataToDb, normalizeIkuCell, syncIkuYearValues, validateIkuPayload } from '@/lib/ikuRecordMapper';

const yearlyDocumentFromRow = (row: any, year: string) => ({
    documentUrl: normalizeIkuCell(row[`documentUrl_${year}`]) || normalizeIkuCell(row[`documentUrl${year}`]),
    documentName: normalizeIkuCell(row[`documentName_${year}`]) || normalizeIkuCell(row[`documentName${year}`]),
    documentType: normalizeIkuCell(row[`documentType_${year}`]) || normalizeIkuCell(row[`documentType${year}`]),
});

const yearsFromRow = (row: any) => {
    const years = new Set<string>();
    Object.keys(row).forEach((key) => {
        const match = key.match(/^(?:target|achievement|documentUrl|documentName|documentType)_?(\d{4})$/);
        if (match) years.add(match[1]);
    });
    return Array.from(years).sort((a, b) => Number(a) - Number(b));
};

const recordFromYears = (row: any, years: string[], prefix: string) =>
    Object.fromEntries(years.map((year) => [year, normalizeIkuCell(row[`${prefix}_${year}`]) || normalizeIkuCell(row[`${prefix}${year}`])]));

export async function POST(req: Request) {
    const session = await verifySession();
    if (!session) {
        return NextResponse.json({ message: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file || typeof file === 'string') {
            return NextResponse.json({ message: 'File Excel wajib diunggah' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        let imported = 0;

        for (const row of rows) {
            const years = yearsFromRow(row);
            const payload = {
                id: normalizeIkuCell(row.id),
                category: normalizeIkuCell(row.category),
                ikuNum: normalizeIkuCell(row.ikuNum),
                indicator: normalizeIkuCell(row.indicator),
                unit: normalizeIkuCell(row.unit),
                documents: Object.fromEntries(years.map((year) => [year, yearlyDocumentFromRow(row, year)])),
                targets: recordFromYears(row, years, 'target'),
                achievements: recordFromYears(row, years, 'achievement'),
            };

            const error = validateIkuPayload(payload);
            if (error) continue;

            const dbPayload = ikuDataToDb(payload);
            const existing = dbPayload.id ? await IkuRecord.findByPk(dbPayload.id) : null;

            if (existing) {
                await existing.update(dbPayload);
                await syncIkuYearValues(dbPayload.id, payload);
            } else {
                const created = await IkuRecord.create(dbPayload);
                await syncIkuYearValues(created.getDataValue('id') as string, payload);
            }
            imported += 1;
        }

        return NextResponse.json({ message: 'Import selesai', imported });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
