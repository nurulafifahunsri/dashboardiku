import { NextResponse } from 'next/server';
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

const ikuDataToDb = (payload: any) => {
    const data: any = {
        id: payload.id,
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession();
    if (!session) {
        return NextResponse.json({ message: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const error = validatePayload(body);
        if (error) return NextResponse.json({ message: error }, { status: 400 });

        const { id } = await params;
        const found = await IkuRecord.findByPk(id);
        if (!found) return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });

        const payload = ikuDataToDb({ ...body, id });
        await found.update(payload);
        return NextResponse.json(rowToIkuData(found.get({ plain: true })));
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession();
    if (!session) {
        return NextResponse.json({ message: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const found = await IkuRecord.findByPk(id);
        if (!found) return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });

        await found.destroy();
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
