import { NextResponse } from "next/server";
import { IkuRecord, MasterYear } from "@/lib/db";
import { buildPerformanceContractRows } from "@/lib/performanceContract";
import { generatePerformanceContractPdf } from "@/lib/performanceContractPdf";
import { IKUData, SUPPORTED_YEARS, Year } from "@/types";

export const runtime = "nodejs";

const normalizeCell = (value: any) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return String(value);
};

const rowToIkuData = (row: any): IKUData => {
  const targets: Partial<Record<Year, string>> = {};
  const achievements: Partial<Record<Year, string>> = {};

  SUPPORTED_YEARS.forEach((year) => {
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
    targets: targets as Record<Year, string>,
    achievements,
    documentUrl: normalizeCell(row.documentUrl),
    documentName: normalizeCell(row.documentName),
    documentType: normalizeCell(row.documentType),
  };
};

const resolveYear = async (requestedYear: string | null): Promise<Year> => {
  if (SUPPORTED_YEARS.includes(requestedYear as Year)) return requestedYear as Year;

  const activeYear = await MasterYear.findOne({
    where: { is_active: true },
    order: [["sort_order", "DESC"], ["year", "DESC"]],
  });

  return (activeYear?.getDataValue("year") || "2026") as Year;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = await resolveYear(url.searchParams.get("year"));
    const rows = await IkuRecord.findAll({ order: [["createdAt", "ASC"]] });
    const data = rows.map((row) => rowToIkuData(row.get({ plain: true })));
    const contractRows = buildPerformanceContractRows(data, year);
    const buffer = generatePerformanceContractPdf(contractRows, year);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="kontrak-kinerja-${year}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Gagal export kontrak kinerja" }, { status: 500 });
  }
}
