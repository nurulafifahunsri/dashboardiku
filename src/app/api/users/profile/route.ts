import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { User } from '@/lib/db';

export async function PUT(req: Request) {
    const session = await verifySession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { username, name } = await req.json();

        if (!username || !name) {
            return NextResponse.json({ error: 'Username and name are required' }, { status: 400 });
        }

        const user = await User.findByPk(session.userId as string);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if the new username is already taken by someone else
        if (username !== user.getDataValue('username')) {
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
            }
        }

        await user.update({ username, name });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
