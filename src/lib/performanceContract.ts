import { IKUData, SasaranProgram, Year } from "@/types";

export const performanceCategoryOrder = [
  SasaranProgram.Talenta,
  SasaranProgram.Inovasi,
  SasaranProgram.Kontribusi,
  SasaranProgram.TataKelola,
];

export interface PerformanceContractRow {
  id: string;
  categoryNo: number;
  category: string;
  ikuNum: string;
  indicator: string;
  unit: string;
  target: string;
  realization: string;
  documentUrl?: string;
  documentName?: string;
  documentType?: string;
  showCategory: boolean;
  categoryRowSpan: number;
  showIku: boolean;
  ikuRowSpan: number;
}

export const hasPerformanceYearEntry = (item: IKUData, year: Year) =>
  item.targets?.[year] !== undefined || item.achievements?.[year] !== undefined;

export const formatPerformanceValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const ikuOrder = (ikuNum: string) => {
  const parsed = Number(ikuNum.replace(/\D/g, ""));
  return Number.isFinite(parsed) ? parsed : 999;
};

const categoryOrder = (category: string) => {
  const index = performanceCategoryOrder.findIndex((item) => item === category);
  return index === -1 ? performanceCategoryOrder.length + 1 : index + 1;
};

export const buildPerformanceContractRows = (data: IKUData[], year: Year): PerformanceContractRow[] => {
  const sorted = data
    .filter((item) => hasPerformanceYearEntry(item, year))
    .sort((a, b) => {
      const categoryDiff = categoryOrder(a.category) - categoryOrder(b.category);
      if (categoryDiff !== 0) return categoryDiff;
      const ikuDiff = ikuOrder(a.ikuNum) - ikuOrder(b.ikuNum);
      if (ikuDiff !== 0) return ikuDiff;
      return String(a.indicator).localeCompare(String(b.indicator), "id");
    });

  const rows: PerformanceContractRow[] = sorted.map((item) => ({
    id: item.id,
    categoryNo: categoryOrder(item.category),
    category: item.category,
    ikuNum: item.ikuNum,
    indicator: item.indicator,
    unit: item.unit,
    target: formatPerformanceValue(item.targets?.[year]),
    realization: formatPerformanceValue(item.achievements?.[year]),
    documentUrl: item.documentUrl,
    documentName: item.documentName,
    documentType: item.documentType,
    showCategory: false,
    categoryRowSpan: 1,
    showIku: false,
    ikuRowSpan: 1,
  }));

  let categoryStart = 0;
  while (categoryStart < rows.length) {
    let categoryEnd = categoryStart + 1;
    while (categoryEnd < rows.length && rows[categoryEnd].category === rows[categoryStart].category) {
      categoryEnd += 1;
    }

    rows[categoryStart].showCategory = true;
    rows[categoryStart].categoryRowSpan = categoryEnd - categoryStart;

    let ikuStart = categoryStart;
    while (ikuStart < categoryEnd) {
      let ikuEnd = ikuStart + 1;
      while (ikuEnd < categoryEnd && rows[ikuEnd].ikuNum === rows[ikuStart].ikuNum) {
        ikuEnd += 1;
      }
      rows[ikuStart].showIku = true;
      rows[ikuStart].ikuRowSpan = ikuEnd - ikuStart;
      ikuStart = ikuEnd;
    }

    categoryStart = categoryEnd;
  }

  return rows;
};
