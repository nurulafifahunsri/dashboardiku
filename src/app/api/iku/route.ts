import { NextResponse } from 'next/server';
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

export async function GET() {
    try {
        const rows = await IkuRecord.findAll({ order: [['createdAt', 'ASC']] });
        return NextResponse.json(rows.map((row) => rowToIkuData(row.get({ plain: true }))));
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const error = validatePayload(body);
        if (error) return NextResponse.json({ message: error }, { status: 400 });

        const payload = ikuDataToDb(body);
        const created = await IkuRecord.create(payload);
        return NextResponse.json(rowToIkuData(created.get({ plain: true })), { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
