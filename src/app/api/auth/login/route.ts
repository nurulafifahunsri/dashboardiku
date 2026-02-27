import { NextResponse } from 'next/server';
import { User } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const user = await User.findOne({ where: { username } });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.getDataValue('password_hash'));

        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Pass the user ID and role securely
        await createSession({
            userId: user.getDataValue('id'),
            role: user.getDataValue('role'),
        });

        return NextResponse.json({
            user: {
                id: user.getDataValue('id'),
                username: user.getDataValue('username'),
                name: user.getDataValue('name'),
                role: user.getDataValue('role'),
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
