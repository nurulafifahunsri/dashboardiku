import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { User } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Anda tidak memiliki akses admin' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { username, name, email, role, password } = await req.json();

        const user = await User.findByPk(id);
        if (!user) {
            return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
        }

        if (username && username !== user.getDataValue('username')) {
            const duplicateUsername = await User.findOne({ where: { username } });
            if (duplicateUsername) {
                return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
            }
        }

        if (email && email !== user.getDataValue('email')) {
            const duplicateEmail = await User.findOne({ where: { email } });
            if (duplicateEmail) {
                return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
            }
        }

        const updates: any = { username, name, email, role };
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updates.password_hash = await bcrypt.hash(password, salt);
        }

        await user.update(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await verifySession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Anda tidak memiliki akses admin' }, { status: 401 });
    }

    try {
        const { id } = await params;
        if (id === session.userId) {
            return NextResponse.json({ error: 'Anda tidak bisa menghapus akun sendiri' }, { status: 400 });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
        }

        await user.destroy();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 });
    }
}
