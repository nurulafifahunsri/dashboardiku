import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { IkuRecord } from '@/lib/db';
import { randomUUID } from 'node:crypto';

const years = ['2025', '2026', '2027', '2028', '2029', '2030'];

const normalizeCell = (value: any) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
    }
    return String(value);
};

const ikuDataToDb = (payload: any) => {
    const data: any = {
        id: payload.id || randomUUID(),
        category: payload.category,
        ikuNum: payload.ikuNum,
        indicator: payload.indicator,
        unit: payload.unit,
    };

    years.forEach((year) => {
        data[`target${year}`] = normalizeCell(payload.targets?.[year]) || null;
        data[`achievement${year}`] = normalizeCell(payload.achievements?.[year]) || null;
    });

    return data;
};

const validatePayload = (payload: any) => {
    if (!payload?.category || !payload?.ikuNum || !payload?.indicator || !payload?.unit) {
        return 'Field wajib: category, ikuNum, indicator, unit';
    }
    return null;
};

export async function POST(req: Request) {
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
            const payload = {
                id: normalizeCell(row.id),
                category: normalizeCell(row.category),
                ikuNum: normalizeCell(row.ikuNum),
                indicator: normalizeCell(row.indicator),
                unit: normalizeCell(row.unit),
                targets: {
                    '2025': normalizeCell(row.target_2025),
                    '2026': normalizeCell(row.target_2026),
                    '2027': normalizeCell(row.target_2027),
                    '2028': normalizeCell(row.target_2028),
                    '2029': normalizeCell(row.target_2029),
                    '2030': normalizeCell(row.target_2030),
                },
                achievements: {
                    '2025': normalizeCell(row.achievement_2025),
                    '2026': normalizeCell(row.achievement_2026),
                    '2027': normalizeCell(row.achievement_2027),
                    '2028': normalizeCell(row.achievement_2028),
                    '2029': normalizeCell(row.achievement_2029),
                    '2030': normalizeCell(row.achievement_2030),
                },
            };

            const error = validatePayload(payload);
            if (error) continue;

            const dbPayload = ikuDataToDb(payload);
            const existing = dbPayload.id ? await IkuRecord.findByPk(dbPayload.id) : null;

            if (existing) {
                await existing.update(dbPayload);
            } else {
                await IkuRecord.create(dbPayload);
            }
            imported += 1;
        }

        return NextResponse.json({ message: 'Import selesai', imported });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
