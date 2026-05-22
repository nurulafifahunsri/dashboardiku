import { NextResponse } from "next/server";
import { IkuRecord, MasterYear } from "@/lib/db";
import { buildPerformanceContractRows } from "@/lib/performanceContract";
import { generatePerformanceContractPdf } from "@/lib/performanceContractPdf";
import { fetchIkuYearValues, rowToIkuData } from "@/lib/ikuRecordMapper";
import { Year } from "@/types";

export const runtime = "nodejs";

const productionBaseUrl = "https://dashboardiku.ilkom.unsri.ac.id";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isLocalUrl = (value: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(value);

const resolvePublicBaseUrl = (req: Request, requestUrl: URL) => {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  if (configuredUrl && !isLocalUrl(configuredUrl)) return trimTrailingSlash(configuredUrl);

  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost) {
    const forwardedUrl = `${forwardedProto}://${forwardedHost}`;
    if (!isLocalUrl(forwardedUrl)) return trimTrailingSlash(forwardedUrl);
  }

  const host = req.headers.get("host")?.split(",")[0]?.trim();
  if (host) {
    const hostUrl = `${requestUrl.protocol.replace(":", "")}://${host}`;
    if (!isLocalUrl(hostUrl)) return trimTrailingSlash(hostUrl);
  }

  if (configuredUrl) return trimTrailingSlash(configuredUrl);
  if (!isLocalUrl(requestUrl.origin)) return trimTrailingSlash(requestUrl.origin);
  return process.env.NODE_ENV === "production" ? productionBaseUrl : trimTrailingSlash(requestUrl.origin);
};

const resolveYear = async (requestedYear: string | null): Promise<Year> => {
  if (requestedYear && /^\d{4}$/.test(requestedYear)) return requestedYear;

  const activeYear = await MasterYear.findOne({
    where: { is_active: true, is_default: true },
    order: [["sort_order", "ASC"], ["year", "ASC"]],
  });
  if (activeYear) return activeYear.getDataValue("year") as Year;

  const fallbackYear = await MasterYear.findOne({
    where: { is_active: true },
    order: [["sort_order", "ASC"], ["year", "ASC"]],
  });

  return (fallbackYear?.getDataValue("year") || "2026") as Year;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = await resolveYear(url.searchParams.get("year"));
    const rows = await IkuRecord.findAll({ order: [["createdAt", "ASC"]] });
    const plainRows = rows.map((row) => row.get({ plain: true }) as any);
    const valuesByRecord = await fetchIkuYearValues(plainRows.map((row) => row.id));
    const data = plainRows.map((row) => rowToIkuData(row, valuesByRecord.get(row.id) || []));
    const contractRows = buildPerformanceContractRows(data, year);
    const buffer = generatePerformanceContractPdf(contractRows, year, resolvePublicBaseUrl(req, url));

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
