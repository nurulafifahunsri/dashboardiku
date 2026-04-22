import { NextResponse } from 'next/server';
import { User } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username/email dan password wajib diisi' }, { status: 400 });
        }

        const user = await User.findOne({
            where: {
                ...(username.includes('@') ? { email: username } : { username }),
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.getDataValue('password_hash'));

        if (!isMatch) {
            return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
        }

        await createSession({
            userId: user.getDataValue('id'),
            role: user.getDataValue('role'),
        });

        return NextResponse.json({
            user: {
                id: user.getDataValue('id'),
                username: user.getDataValue('username'),
                name: user.getDataValue('name'),
                email: user.getDataValue('email'),
                role: user.getDataValue('role'),
            }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Terjadi kesalahan pada proses login' }, { status: 500 });
    }
}
