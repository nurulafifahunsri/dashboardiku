import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { User } from '@/lib/db';

export async function DELETE() {
    const session = await verifySession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const user = await User.findByPk(session.userId as string);
        if (!user) {
            return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
        }

        await user.update({ totp_secret: null, totp_enabled: false });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal menonaktifkan authenticator' }, { status: 500 });
    }
}
