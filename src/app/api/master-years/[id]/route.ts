import { NextResponse } from 'next/server';
import { MasterYear } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { SUPPORTED_YEARS } from '@/types';

const mapRow = (row: any) => ({
  id: row.id,
  year: row.year,
  label: row.label,
  isActive: row.is_active,
  sortOrder: row.sort_order,
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Anda tidak memiliki akses admin' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const row = await MasterYear.findByPk(id);
    if (!row) {
      return NextResponse.json({ error: 'Tahun tidak ditemukan' }, { status: 404 });
    }

    if (body.year && !SUPPORTED_YEARS.includes(body.year)) {
      return NextResponse.json({ error: 'Tahun tidak valid' }, { status: 400 });
    }

    if (body.year && body.year !== row.getDataValue('year')) {
      const duplicate = await MasterYear.findOne({ where: { year: body.year } });
      if (duplicate) {
        return NextResponse.json({ error: 'Tahun sudah digunakan' }, { status: 400 });
      }
    }

    await row.update({
      year: body.year ?? row.getDataValue('year'),
      label: body.label ?? row.getDataValue('label'),
      is_active: typeof body.isActive === 'boolean' ? body.isActive : row.getDataValue('is_active'),
      sort_order: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : row.getDataValue('sort_order'),
    } as any);

    return NextResponse.json(mapRow(row.get({ plain: true })));
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memperbarui tahun' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Anda tidak memiliki akses admin' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const row = await MasterYear.findByPk(id);

    if (!row) {
      return NextResponse.json({ error: 'Tahun tidak ditemukan' }, { status: 404 });
    }

    await row.destroy();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus tahun' }, { status: 500 });
  }
}
