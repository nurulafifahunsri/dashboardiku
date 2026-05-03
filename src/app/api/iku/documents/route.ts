import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { verifySession } from '@/lib/auth';
import { documentPublicUrl, documentUploadDir } from '@/lib/ikuDocuments';

export const runtime = 'nodejs';

const allowedTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
]);
const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.csv']);
const maxFileSize = 10 * 1024 * 1024;

const extensionFromType = (type: string) => {
  if (type === 'application/pdf') return '.pdf';
  if (type === 'image/jpeg') return '.jpg';
  if (type === 'image/png') return '.png';
  if (type === 'image/gif') return '.gif';
  if (type === 'image/webp') return '.webp';
  if (type === 'text/csv' || type === 'application/csv' || type === 'application/vnd.ms-excel') return '.csv';
  return '';
};

export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ message: 'Sesi tidak valid' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ message: 'Dokumen wajib diunggah' }, { status: 400 });
    }

    const originalExt = path.extname(file.name).toLowerCase();
    if (!allowedTypes.has(file.type) && !allowedExtensions.has(originalExt)) {
      return NextResponse.json({ message: 'Dokumen harus berupa PDF, gambar, atau CSV' }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ message: 'Ukuran dokumen maksimal 10MB' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const uploadDir = documentUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const extension = allowedExtensions.has(originalExt) ? originalExt : extensionFromType(file.type);
    const filename = `${randomUUID()}${extension}`;
    await writeFile(path.join(uploadDir, filename), bytes);

    return NextResponse.json({
      documentUrl: documentPublicUrl(filename),
      documentName: file.name,
      documentType: file.type,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
