import express from 'express';
import cors from 'cors';
import multer from 'multer';
import XLSX from 'xlsx';
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = Number(process.env.API_PORT || 4000);
const DB_NAME = process.env.DB_NAME || 'dashboard_iku';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false,
});

const IkuRecord = sequelize.define(
  'IkuRecord',
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    category: { type: DataTypes.STRING(128), allowNull: false },
    ikuNum: { type: DataTypes.STRING(32), allowNull: false },
    indicator: { type: DataTypes.TEXT, allowNull: false },
    unit: { type: DataTypes.STRING(64), allowNull: false },
    target2025: { type: DataTypes.STRING(64), allowNull: true },
    target2026: { type: DataTypes.STRING(64), allowNull: true },
    target2027: { type: DataTypes.STRING(64), allowNull: true },
    target2028: { type: DataTypes.STRING(64), allowNull: true },
    target2029: { type: DataTypes.STRING(64), allowNull: true },
    target2030: { type: DataTypes.STRING(64), allowNull: true },
    achievement2025: { type: DataTypes.STRING(64), allowNull: true },
    achievement2026: { type: DataTypes.STRING(64), allowNull: true },
    achievement2027: { type: DataTypes.STRING(64), allowNull: true },
    achievement2028: { type: DataTypes.STRING(64), allowNull: true },
    achievement2029: { type: DataTypes.STRING(64), allowNull: true },
    achievement2030: { type: DataTypes.STRING(64), allowNull: true },
  },
  {
    tableName: 'iku_records',
    timestamps: true,
  }
);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const years = ['2025', '2026', '2027', '2028', '2029', '2030'];

const normalizeCell = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return String(value);
};

const rowToIkuData = (row) => {
  const targets = {};
  const achievements = {};

  years.forEach((year) => {
    const target = normalizeCell(row[`target${year}`]);
    const achievement = normalizeCell(row[`achievement${year}`]);
    if (target !== undefined) targets[year] = target;
    if (achievement !== undefined) achievements[year] = achievement;
  });

  return {
    id: row.id,
    category: row.category,
    ikuNum: row.ikuNum,
    indicator: row.indicator,
    unit: row.unit,
    targets,
    achievements,
  };
};

const ikuDataToDb = (payload) => {
  const data = {
    id: payload.id || randomUUID(),
    category: payload.category,
    ikuNum: payload.ikuNum,
    indicator: payload.indicator,
    unit: payload.unit,
  };

  years.forEach((year) => {
    data[`target${year}`] = normalizeCell(payload.targets?.[year]) || null;
    data[`achievement${year}`] = normalizeCell(payload.achievements?.[year]) || null;
  });

  return data;
};

const excelRowsFromIku = (data) => {
  return data.map((item) => ({
    id: item.id,
    category: item.category,
    ikuNum: item.ikuNum,
    indicator: item.indicator,
    unit: item.unit,
    target_2025: item.targets?.['2025'] ?? '',
    target_2026: item.targets?.['2026'] ?? '',
    target_2027: item.targets?.['2027'] ?? '',
    target_2028: item.targets?.['2028'] ?? '',
    target_2029: item.targets?.['2029'] ?? '',
    target_2030: item.targets?.['2030'] ?? '',
    achievement_2025: item.achievements?.['2025'] ?? '',
    achievement_2026: item.achievements?.['2026'] ?? '',
    achievement_2027: item.achievements?.['2027'] ?? '',
    achievement_2028: item.achievements?.['2028'] ?? '',
    achievement_2029: item.achievements?.['2029'] ?? '',
    achievement_2030: item.achievements?.['2030'] ?? '',
  }));
};

const validatePayload = (payload) => {
  if (!payload?.category || !payload?.ikuNum || !payload?.indicator || !payload?.unit) {
    return 'Field wajib: category, ikuNum, indicator, unit';
  }
  return null;
};

app.get('/api/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true, db: 'connected' });
  } catch {
    res.status(500).json({ ok: false, db: 'disconnected' });
  }
});

app.get('/api/iku', async (_req, res) => {
  const rows = await IkuRecord.findAll({ order: [['createdAt', 'ASC']] });
  res.json(rows.map((row) => rowToIkuData(row.get({ plain: true }))));
});

app.post('/api/iku', async (req, res) => {
  const error = validatePayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const payload = ikuDataToDb(req.body);
  const created = await IkuRecord.create(payload);
  res.status(201).json(rowToIkuData(created.get({ plain: true })));
});

app.put('/api/iku/:id', async (req, res) => {
  const error = validatePayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const found = await IkuRecord.findByPk(req.params.id);
  if (!found) return res.status(404).json({ message: 'Data tidak ditemukan' });

  const payload = ikuDataToDb({ ...req.body, id: req.params.id });
  await found.update(payload);
  res.json(rowToIkuData(found.get({ plain: true })));
});

app.delete('/api/iku/:id', async (req, res) => {
  const found = await IkuRecord.findByPk(req.params.id);
  if (!found) return res.status(404).json({ message: 'Data tidak ditemukan' });

  await found.destroy();
  res.status(204).send();
});

app.post('/api/iku/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File Excel wajib diunggah' });

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

  let imported = 0;

  for (const row of rows) {
    const payload = {
      id: normalizeCell(row.id),
      category: normalizeCell(row.category),
      ikuNum: normalizeCell(row.ikuNum),
      indicator: normalizeCell(row.indicator),
      unit: normalizeCell(row.unit),
      targets: {
        '2025': normalizeCell(row.target_2025),
        '2026': normalizeCell(row.target_2026),
        '2027': normalizeCell(row.target_2027),
        '2028': normalizeCell(row.target_2028),
        '2029': normalizeCell(row.target_2029),
        '2030': normalizeCell(row.target_2030),
      },
      achievements: {
        '2025': normalizeCell(row.achievement_2025),
        '2026': normalizeCell(row.achievement_2026),
        '2027': normalizeCell(row.achievement_2027),
        '2028': normalizeCell(row.achievement_2028),
        '2029': normalizeCell(row.achievement_2029),
        '2030': normalizeCell(row.achievement_2030),
      },
    };

    const error = validatePayload(payload);
    if (error) continue;

    const dbPayload = ikuDataToDb(payload);
    const existing = dbPayload.id ? await IkuRecord.findByPk(dbPayload.id) : null;

    if (existing) {
      await existing.update(dbPayload);
    } else {
      await IkuRecord.create(dbPayload);
    }
    imported += 1;
  }

  res.json({ message: 'Import selesai', imported });
});

app.get('/api/iku/export', async (_req, res) => {
  const rows = await IkuRecord.findAll({ order: [['createdAt', 'ASC']] });
  const data = rows.map((row) => rowToIkuData(row.get({ plain: true })));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelRowsFromIku(data));
  XLSX.utils.book_append_sheet(workbook, worksheet, 'IKU Fakultas-2');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="IKU Fakultas-2-export.xlsx"');
  res.send(buffer);
});

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`API ready on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start API:', error.message);
    process.exit(1);
  }
};

start();
