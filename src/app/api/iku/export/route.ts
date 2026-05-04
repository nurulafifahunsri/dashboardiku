import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { IkuRecord, MasterYear } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { fetchIkuYearValues, rowToIkuData } from '@/lib/ikuRecordMapper';
import { IKUData, Year } from '@/types';

const collectExportYears = (data: IKUData[], masterYears: Year[]) => {
    const years = new Set(masterYears);
    data.forEach((item) => {
        Object.keys(item.targets || {}).forEach((year) => years.add(year));
        Object.keys(item.achievements || {}).forEach((year) => years.add(year));
        Object.keys(item.documents || {}).forEach((year) => years.add(year));
    });
    return Array.from(years).sort((a, b) => Number(a) - Number(b));
};

const excelRowsFromIku = (data: IKUData[], years: Year[]) => {
    return data.map((item) => {
        const row: Record<string, string> = {
            id: item.id,
            category: item.category,
            ikuNum: item.ikuNum,
            indicator: item.indicator,
            unit: item.unit,
        };

        years.forEach((year) => {
            const document = item.documents?.[year] || {};
            row[`documentUrl_${year}`] = document.documentUrl ?? '';
            row[`documentName_${year}`] = document.documentName ?? '';
            row[`documentType_${year}`] = document.documentType ?? '';
            row[`target_${year}`] = String(item.targets?.[year] ?? '');
            row[`achievement_${year}`] = String(item.achievements?.[year] ?? '');
        });

        return row;
    });
};

export async function GET() {
    const session = await verifySession();
    if (!session) {
        return NextResponse.json({ message: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const rows = await IkuRecord.findAll({ order: [['createdAt', 'ASC']] });
        const plainRows = rows.map((row) => row.get({ plain: true }) as any);
        const valuesByRecord = await fetchIkuYearValues(plainRows.map((row) => row.id));
        const data = plainRows.map((row) => rowToIkuData(row, valuesByRecord.get(row.id) || []));
        const masterYears = await MasterYear.findAll({ order: [['sort_order', 'ASC'], ['year', 'ASC']] });
        const exportYears = collectExportYears(data, masterYears.map((row) => String(row.getDataValue('year'))));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelRowsFromIku(data, exportYears));
        XLSX.utils.book_append_sheet(workbook, worksheet, 'IKU Fakultas-2');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="IKU Fakultas-2-export.xlsx"',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
