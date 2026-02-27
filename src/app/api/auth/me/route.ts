import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { User } from '@/lib/db';

export async function GET() {
    const session = await verifySession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await User.findByPk(session.userId as string, {
            attributes: ['id', 'username', 'name', 'role'], // Never send password hash back
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user.getDataValue('id'),
                username: user.getDataValue('username'),
                name: user.getDataValue('name'),
                role: user.getDataValue('role'),
            }
        });
    } catch (error) {
        console.error('Auth verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
