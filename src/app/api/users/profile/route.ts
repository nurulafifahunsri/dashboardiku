import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { User } from '@/lib/db';

export async function PUT(req: Request) {
    const session = await verifySession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    try {
        const { username, name, email } = await req.json();

        if (!username || !name || !email) {
            return NextResponse.json({ error: 'Username, nama, dan email wajib diisi' }, { status: 400 });
        }

        const user = await User.findByPk(session.userId as string);
        if (!user) {
            return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
        }

        if (username !== user.getDataValue('username')) {
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
            }
        }

        if (email !== user.getDataValue('email')) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) {
                return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
            }
        }

        await user.update({ username, name, email });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal memperbarui profil' }, { status: 500 });
    }
}
