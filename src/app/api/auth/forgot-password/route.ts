import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { User } from '@/lib/db';
import { sendTemplateEmail, isMailerConfigured } from '@/lib/mailer';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const RESET_EXPIRES_MINUTES = Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES || 60);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, tautan reset akan dikirimkan.'
      });
    }

    if (!isMailerConfigured) {
      return NextResponse.json({
        error: 'Fitur lupa password belum aktif. Konfigurasi SMTP belum lengkap.'
      }, { status: 500 });
    }

    const plainToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(plainToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_EXPIRES_MINUTES * 60 * 1000);

    await user.update({
      reset_token: hashedToken,
      reset_token_expires_at: expiresAt,
    });

    const resetUrl = `${APP_URL}/?menu=reset-password&token=${plainToken}`;

    await sendTemplateEmail({
      to: user.getDataValue('email'),
      subject: 'Reset Password Dashboard IKU Fasilkom',
      template: 'reset-password',
      context: {
        name: user.getDataValue('name'),
        appName: 'Dashboard IKU Fasilkom',
        resetUrl,
        expiredAt: expiresAt.toLocaleString('id-ID', {
          dateStyle: 'full',
          timeStyle: 'short',
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, tautan reset akan dikirimkan.'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memproses lupa password' }, { status: 500 });
  }
}
