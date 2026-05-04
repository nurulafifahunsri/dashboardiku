import { NextResponse } from 'next/server';
import { IkuRecord } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { fetchIkuYearValues, ikuDataToDb, rowToIkuData, syncIkuYearValues, validateIkuPayload } from '@/lib/ikuRecordMapper';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession();
    if (!session) {
        return NextResponse.json({ message: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const error = validateIkuPayload(body);
        if (error) return NextResponse.json({ message: error }, { status: 400 });

        const { id } = await params;
        const found = await IkuRecord.findByPk(id);
        if (!found) return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });

        const payload = ikuDataToDb({ ...body, id });
        await found.update(payload);
        await syncIkuYearValues(id, body);
        const yearValues = await fetchIkuYearValues([id]);
        return NextResponse.json(rowToIkuData(found.get({ plain: true }), yearValues.get(id) || []));
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
