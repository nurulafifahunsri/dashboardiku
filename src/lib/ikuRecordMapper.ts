import { randomUUID } from "node:crypto";
import { IkuRecordYearValue } from "@/lib/db";
import { IKUData, IKUDocument, Year } from "@/types";

export const normalizeIkuCell = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return String(value);
};

const hasDocumentValue = (document?: IKUDocument) =>
  Boolean(document?.documentUrl || document?.documentName || document?.documentType);

const normalizeYear = (year: unknown) => {
  const normalized = normalizeIkuCell(year);
  return normalized && /^\d{4}$/.test(normalized) ? normalized : undefined;
};

export const rowToIkuData = (row: any, yearValues: any[] = []): IKUData => {
  const targets: Partial<Record<Year, string>> = {};
  const achievements: Partial<Record<Year, string>> = {};
  const documents: Partial<Record<Year, IKUDocument>> = {};

  yearValues.forEach((value) => {
    const year = normalizeYear(value.year);
    if (!year) return;

    const target = normalizeIkuCell(value.target_value);
    const achievement = normalizeIkuCell(value.achievement_value);
    const document = {
      documentUrl: normalizeIkuCell(value.documentUrl),
      documentName: normalizeIkuCell(value.documentName),
      documentType: normalizeIkuCell(value.documentType),
    };

    if (target !== undefined) targets[year] = target;
    if (achievement !== undefined) achievements[year] = achievement;
    if (hasDocumentValue(document)) documents[year] = document;
  });

  return {
    id: row.id,
    category: row.category,
    ikuNum: row.ikuNum,
    indicator: row.indicator,
    unit: row.unit,
    targets,
    achievements,
    documents,
  };
};

export const ikuDataToDb = (payload: any) => ({
  id: payload.id || randomUUID(),
  category: payload.category,
  ikuNum: payload.ikuNum,
  indicator: payload.indicator,
  unit: payload.unit,
});

const yearKeysFromPayload = (payload: any) => {
  const keys = new Set<string>();
  [payload.targets, payload.achievements, payload.documents].forEach((record) => {
    if (!record || typeof record !== "object") return;
    Object.keys(record).forEach((year) => {
      const normalized = normalizeYear(year);
      if (normalized) keys.add(normalized);
    });
  });
  return Array.from(keys).sort((a, b) => Number(a) - Number(b));
};

export const syncIkuYearValues = async (ikuRecordId: string, payload: any) => {
  const years = yearKeysFromPayload(payload);

  for (const year of years) {
    const document = payload.documents?.[year] || {};
    const data = {
      iku_record_id: ikuRecordId,
      year,
      target_value: normalizeIkuCell(payload.targets?.[year]) || null,
      achievement_value: normalizeIkuCell(payload.achievements?.[year]) || null,
      documentUrl: normalizeIkuCell(document.documentUrl) || null,
      documentName: normalizeIkuCell(document.documentName) || null,
      documentType: normalizeIkuCell(document.documentType) || null,
    };

    const existing = await IkuRecordYearValue.findOne({ where: { iku_record_id: ikuRecordId, year } });
    if (existing) {
      await existing.update(data as any);
    } else {
      await IkuRecordYearValue.create({ id: randomUUID(), ...data } as any);
    }
  }
};

export const fetchIkuYearValues = async (ikuRecordIds: string[]) => {
  if (!ikuRecordIds.length) return new Map<string, any[]>();

  const rows = await IkuRecordYearValue.findAll({ where: { iku_record_id: ikuRecordIds } });
  return rows.reduce((acc, row) => {
    const plain = row.get({ plain: true }) as any;
    const list = acc.get(plain.iku_record_id) || [];
    list.push(plain);
    acc.set(plain.iku_record_id, list);
    return acc;
  }, new Map<string, any[]>());
};

export const validateIkuPayload = (payload: any) => {
  if (!payload?.category || !payload?.ikuNum || !payload?.indicator || !payload?.unit) {
    return "Field wajib: category, ikuNum, indicator, unit";
  }
  return null;
};
