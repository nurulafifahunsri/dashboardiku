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

    if (body.year && !isValidYear(body.year)) {
      return NextResponse.json({ error: 'Tahun tidak valid' }, { status: 400 });
    }

    if (body.year && body.year !== row.getDataValue('year')) {
      const duplicate = await MasterYear.findOne({ where: { year: body.year } });
      if (duplicate) {
        return NextResponse.json({ error: 'Tahun sudah digunakan' }, { status: 400 });
      }
    }

    const nextYear = body.year ?? row.getDataValue('year');

    await sequelize.transaction(async (transaction) => {
      if (body.isDefault === true) {
        await MasterYear.update({ is_default: false } as any, { where: {}, transaction });
      }

      const nextIsDefault =
        typeof body.isDefault === 'boolean' ? body.isDefault : row.getDataValue('is_default');

      await row.update({
        year: body.year ?? row.getDataValue('year'),
        label: body.label ?? row.getDataValue('label'),
        is_active:
          nextIsDefault === true
            ? true
            : typeof body.isActive === 'boolean'
              ? body.isActive
              : row.getDataValue('is_active'),
        is_default: nextIsDefault,
        sort_order: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : row.getDataValue('sort_order'),
        chart_colors:
          body.year && body.year !== row.getDataValue('year')
            ? JSON.stringify(generateChartColors(body.year))
            : row.getDataValue('chart_colors') || JSON.stringify(generateChartColors(nextYear)),
      } as any, { transaction });
    });

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
