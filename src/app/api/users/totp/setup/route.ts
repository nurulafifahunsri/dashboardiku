import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { User } from '@/lib/db';
import { createTotpUri, generateTotpSecret } from '@/lib/totp';

export async function POST() {
    const session = await verifySession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const user = await User.findByPk(session.userId as string);
        if (!user) {
            return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
        }

        if (user.getDataValue('totp_enabled')) {
            return NextResponse.json({ error: 'Google Authenticator sudah aktif. Nonaktifkan terlebih dahulu untuk membuat secret baru.' }, { status: 400 });
        }

        const secret = generateTotpSecret();
        await user.update({ totp_secret: secret, totp_enabled: false });

        return NextResponse.json({
            secret,
            otpauthUrl: createTotpUri(user.getDataValue('email') || user.getDataValue('username'), secret),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal membuat secret authenticator' }, { status: 500 });
    }
}
