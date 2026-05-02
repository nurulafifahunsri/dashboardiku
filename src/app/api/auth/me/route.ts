import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { User } from '@/lib/db';

export async function GET() {
    const session = await verifySession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const user = await User.findByPk(session.userId as string, {
            attributes: ['id', 'username', 'name', 'email', 'role', 'totp_enabled'],
        });

        if (!user) {
            return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user.getDataValue('id'),
                username: user.getDataValue('username'),
                name: user.getDataValue('name'),
                email: user.getDataValue('email'),
                role: user.getDataValue('role'),
                totpEnabled: Boolean(user.getDataValue('totp_enabled')),
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal memeriksa sesi' }, { status: 500 });
    }
}
