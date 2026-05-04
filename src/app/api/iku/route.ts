import { NextResponse } from 'next/server';
import { IkuRecord } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { fetchIkuYearValues, ikuDataToDb, rowToIkuData, syncIkuYearValues, validateIkuPayload } from '@/lib/ikuRecordMapper';

export async function GET() {
    try {
        const rows = await IkuRecord.findAll({ order: [['createdAt', 'ASC']] });
        const plainRows = rows.map((row) => row.get({ plain: true }) as any);
        const valuesByRecord = await fetchIkuYearValues(plainRows.map((row) => row.id));
        return NextResponse.json(plainRows.map((row) => rowToIkuData(row, valuesByRecord.get(row.id) || [])));
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await verifySession();
    if (!session) {
        return NextResponse.json({ message: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const error = validateIkuPayload(body);
        if (error) return NextResponse.json({ message: error }, { status: 400 });

        const payload = ikuDataToDb(body);
        const created = await IkuRecord.create(payload);
        await syncIkuYearValues(created.getDataValue('id') as string, body);
        const yearValues = await fetchIkuYearValues([created.getDataValue('id') as string]);
        return NextResponse.json(rowToIkuData(created.get({ plain: true }), yearValues.get(created.getDataValue('id') as string) || []), { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
