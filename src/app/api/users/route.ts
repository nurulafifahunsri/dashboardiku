import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { User } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
    const session = await verifySession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'name', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await verifySession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { username, name, password, role } = await req.json();

        if (!username || !name || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            name,
            password_hash,
            role: role || 'viewer',
        });

        return NextResponse.json({
            id: newUser.getDataValue('id'),
            username: newUser.getDataValue('username'),
            name: newUser.getDataValue('name'),
            role: newUser.getDataValue('role'),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
