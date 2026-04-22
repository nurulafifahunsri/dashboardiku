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

export async function GET() {
  try {
    const rows = await MasterYear.findAll({ order: [['sort_order', 'ASC'], ['year', 'ASC']] });
    return NextResponse.json(rows.map((row) => mapRow(row.get({ plain: true }))));
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil master tahun' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await verifySession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Anda tidak memiliki akses admin' }, { status: 401 });
  }

  try {
    const { year, label, isActive, sortOrder } = await req.json();

    if (!year || !SUPPORTED_YEARS.includes(year)) {
      return NextResponse.json({ error: 'Tahun tidak valid' }, { status: 400 });
    }

    const existing = await MasterYear.findOne({ where: { year } });
    if (existing) {
      return NextResponse.json({ error: 'Tahun sudah ada' }, { status: 400 });
    }

    const created = await MasterYear.create({
      year,
      label: label || `Tahun ${year}`,
      is_active: isActive ?? true,
      sort_order: Number.isFinite(sortOrder) ? Number(sortOrder) : Number(year),
    } as any);

    return NextResponse.json(mapRow(created.get({ plain: true })), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah master tahun' }, { status: 500 });
  }
}
