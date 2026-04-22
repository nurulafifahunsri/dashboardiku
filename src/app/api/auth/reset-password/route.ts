import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token dan password baru wajib diisi' }, { status: 400 });
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 });
    }

    const hashedToken = createHash('sha256').update(String(token)).digest('hex');

    const user = await User.findOne({
      where: {
        reset_token: hashedToken,
        reset_token_expires_at: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Token reset tidak valid atau sudah kedaluwarsa' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await user.update({
      password_hash,
      reset_token: null,
      reset_token_expires_at: null,
    });

    return NextResponse.json({ success: true, message: 'Password berhasil diperbarui' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memperbarui password' }, { status: 500 });
  }
}
