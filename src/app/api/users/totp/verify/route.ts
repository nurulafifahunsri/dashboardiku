import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { User } from '@/lib/db';
import { verifyTotpCode } from '@/lib/totp';

export async function POST(req: Request) {
    const session = await verifySession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const { code } = await req.json();
        if (!code) {
            return NextResponse.json({ error: 'Kode Google Authenticator wajib diisi' }, { status: 400 });
        }

        const user = await User.findByPk(session.userId as string);
        if (!user) {
            return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
        }

        const secret = user.getDataValue('totp_secret');
        if (!secret) {
            return NextResponse.json({ error: 'Secret authenticator belum dibuat' }, { status: 400 });
        }

        if (!verifyTotpCode(secret, code)) {
            return NextResponse.json({ error: 'Kode Google Authenticator tidak valid' }, { status: 400 });
        }

        await user.update({ totp_enabled: true });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal memverifikasi authenticator' }, { status: 500 });
    }
}
