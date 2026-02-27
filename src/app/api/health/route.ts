import { NextResponse } from 'next/server';
import { sequelize } from '@/lib/db';

export async function GET() {
    try {
        await sequelize.authenticate();
        return NextResponse.json({ ok: true, db: 'connected' });
    } catch (error) {
        return NextResponse.json({ ok: false, db: 'disconnected' }, { status: 500 });
    }
}
