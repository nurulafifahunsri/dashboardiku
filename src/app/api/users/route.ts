import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { User } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
    const session = await verifySession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Anda tidak memiliki akses admin' }, { status: 401 });
    }

    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'name', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Gagal mengambil data pengguna' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await verifySession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Anda tidak memiliki akses admin' }, { status: 401 });
    }

    try {
        const { username, name, email, password, role } = await req.json();

        if (!username || !name || !email || !password) {
            return NextResponse.json({ error: 'Field wajib: username, nama, email, password' }, { status: 400 });
        }

        const duplicateUsername = await User.findOne({ where: { username } });
        if (duplicateUsername) {
            return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
        }

        const duplicateEmail = await User.findOne({ where: { email } });
        if (duplicateEmail) {
            return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            name,
            email,
            password_hash,
            role: role || 'viewer',
        });

        return NextResponse.json({
            id: newUser.getDataValue('id'),
            username: newUser.getDataValue('username'),
            name: newUser.getDataValue('name'),
            email: newUser.getDataValue('email'),
            role: newUser.getDataValue('role'),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal menambahkan pengguna' }, { status: 500 });
    }
}
