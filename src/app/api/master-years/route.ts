import { NextResponse } from 'next/server';
import { MasterYear, sequelize } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { generateChartColors, parseChartColors } from '@/lib/chartColors';

const isValidYear = (year: unknown) => typeof year === 'string' && /^\d{4}$/.test(year);

const mapRow = (row: any) => ({
  id: row.id,
  year: row.year,
  label: row.label,
  isActive: row.is_active,
  isDefault: row.is_default,
  sortOrder: row.sort_order,
  chartColors: parseChartColors(row.chart_colors, row.year),
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
    const { year, label, isActive, isDefault, sortOrder } = await req.json();

    if (!isValidYear(year)) {
      return NextResponse.json({ error: 'Tahun tidak valid' }, { status: 400 });
    }

    const existing = await MasterYear.findOne({ where: { year } });
    if (existing) {
      return NextResponse.json({ error: 'Tahun sudah ada' }, { status: 400 });
    }

    const created = await sequelize.transaction(async (transaction) => {
      if (isDefault === true) {
        await MasterYear.update({ is_default: false } as any, { where: {}, transaction });
      }

      return MasterYear.create({
        year,
        label: label || `Tahun ${year}`,
        is_active: isDefault === true ? true : isActive ?? true,
        is_default: isDefault === true,
        sort_order: Number.isFinite(sortOrder) ? Number(sortOrder) : Number(year),
        chart_colors: JSON.stringify(generateChartColors(year)),
      } as any, { transaction });
    });

    return NextResponse.json(mapRow(created.get({ plain: true })), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah master tahun' }, { status: 500 });
  }
}
