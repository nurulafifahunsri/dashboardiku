import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { IkuRecord } from '@/lib/db';
import { verifySession } from '@/lib/auth';

const years = ['2025', '2026', '2027', '2028', '2029', '2030'];

const normalizeCell = (value: any) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
    }
    return String(value);
};

const rowToIkuData = (row: any) => {
    const targets: Record<string, string> = {};
    const achievements: Record<string, string> = {};

    years.forEach((year) => {
        const target = normalizeCell(row[`target${year}`]);
        const achievement = normalizeCell(row[`achievement${year}`]);
        if (target !== undefined) targets[year] = target;
        if (achievement !== undefined) achievements[year] = achievement;
    });

    return {
        id: row.id,
        category: row.category,
        ikuNum: row.ikuNum,
        indicator: row.indicator,
        unit: row.unit,
        targets,
        achievements,
    };
};

const excelRowsFromIku = (data: any[]) => {
    return data.map((item) => ({
        id: item.id,
        category: item.category,
        ikuNum: item.ikuNum,
        indicator: item.indicator,
        unit: item.unit,
        target_2025: item.targets?.['2025'] ?? '',
        target_2026: item.targets?.['2026'] ?? '',
        target_2027: item.targets?.['2027'] ?? '',
        target_2028: item.targets?.['2028'] ?? '',
        target_2029: item.targets?.['2029'] ?? '',
        target_2030: item.targets?.['2030'] ?? '',
        achievement_2025: item.achievements?.['2025'] ?? '',
        achievement_2026: item.achievements?.['2026'] ?? '',
        achievement_2027: item.achievements?.['2027'] ?? '',
        achievement_2028: item.achievements?.['2028'] ?? '',
        achievement_2029: item.achievements?.['2029'] ?? '',
        achievement_2030: item.achievements?.['2030'] ?? '',
    }));
};

export async function GET() {
    const session = await verifySession();
    if (!session) {
        return NextResponse.json({ message: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const rows = await IkuRecord.findAll({ order: [['createdAt', 'ASC']] });
        const data = rows.map((row) => rowToIkuData(row.get({ plain: true })));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelRowsFromIku(data));
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
