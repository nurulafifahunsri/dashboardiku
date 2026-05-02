import { PerformanceContractRow } from "@/lib/performanceContract";
import { Year } from "@/types";

const pageWidth = 595.28;
const pageHeight = 841.89;
const marginX = 28;
const tableWidth = pageWidth - marginX * 2;
const tableTop = 92;
const headerHeight = 25;
const bottomMargin = 34;
const rowGap = 0;
const fontSize = 7.2;
const lineHeight = 8.4;

const colWidths = [27, 78, 45, 232, 48, 55, 55];
const colX = colWidths.reduce<number[]>((acc, width, index) => {
  acc[index + 1] = acc[index] + width;
  return acc;
}, [marginX]);

interface PdfRow {
  row: PerformanceContractRow;
  height: number;
  indicatorLines: string[];
  categoryLines: string[];
}

interface PageRow extends PdfRow {
  top: number;
}

const cleanText = (value: unknown) =>
  String(value ?? "")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/[^\x20-\x7E]/g, "");

const escapePdf = (value: string) => cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const fmt = (value: number) => Number(value.toFixed(2)).toString();

const textWidth = (value: string, size: number) => cleanText(value).length * size * 0.47;

const wrapText = (value: unknown, width: number, size = fontSize) => {
  const text = cleanText(value).trim();
  if (!text) return ["-"];

  const maxChars = Math.max(4, Math.floor(width / (size * 0.47)));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let index = 0; index < word.length; index += maxChars) {
        lines.push(word.slice(index, index + maxChars));
      }
      return;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : ["-"];
};

const pushRect = (content: string[], x: number, top: number, width: number, height: number, fill = false) => {
  const y = pageHeight - top - height;
  if (fill) {
    content.push(`q 0.95 0.97 0.96 rg ${fmt(x)} ${fmt(y)} ${fmt(width)} ${fmt(height)} re f Q`);
  }
  content.push(`${fmt(x)} ${fmt(y)} ${fmt(width)} ${fmt(height)} re S`);
};

const pushText = (
  content: string[],
  lines: string[],
  x: number,
  top: number,
  width: number,
  height: number,
  options: { size?: number; bold?: boolean; align?: "left" | "center" | "right"; valign?: "top" | "middle" } = {}
) => {
  const size = options.size ?? fontSize;
  const align = options.align ?? "left";
  const valign = options.valign ?? "middle";
  const totalTextHeight = lines.length * lineHeight;
  const startTop = valign === "top" ? top + 5 + size : top + Math.max(size + 2, (height - totalTextHeight) / 2 + size);

  lines.forEach((line, index) => {
    const safeLine = cleanText(line);
    const measured = textWidth(safeLine, size);
    let textX = x + 4;
    if (align === "center") textX = x + Math.max(2, (width - measured) / 2);
    if (align === "right") textX = x + width - measured - 4;
    const textY = pageHeight - (startTop + index * lineHeight);
    content.push(`BT /${options.bold ? "F2" : "F1"} ${fmt(size)} Tf ${fmt(textX)} ${fmt(textY)} Td (${escapePdf(safeLine)}) Tj ET`);
  });
};

const pushCell = (
  content: string[],
  x: number,
  top: number,
  width: number,
  height: number,
  lines: string[],
  options: { size?: number; bold?: boolean; align?: "left" | "center" | "right"; valign?: "top" | "middle"; fill?: boolean } = {}
) => {
  pushRect(content, x, top, width, height, Boolean(options.fill));
  pushText(content, lines, x, top, width, height, options);
};

const buildPdfRows = (rows: PerformanceContractRow[]): PdfRow[] =>
  rows.map((row) => {
    const indicatorLines = wrapText(row.indicator, colWidths[3] - 8);
    const categoryLines = wrapText(row.category.toUpperCase(), colWidths[1] - 8, 7);
    return {
      row,
      indicatorLines,
      categoryLines,
      height: Math.max(18, indicatorLines.length * lineHeight + 8),
    };
  });

const paginateRows = (rows: PdfRow[]) => {
  const pages: PageRow[][] = [];
  let current: PageRow[] = [];
  let cursor = tableTop + headerHeight;
  const maxBottom = pageHeight - bottomMargin;

  rows.forEach((row) => {
    if (current.length && cursor + row.height > maxBottom) {
      pages.push(current);
      current = [];
      cursor = tableTop + headerHeight;
    }

    current.push({ ...row, top: cursor });
    cursor += row.height + rowGap;
  });

  pages.push(current);
  return pages;
};

const pushHeader = (content: string[], year: Year, pageNumber: number) => {
  pushText(content, ["Kontrak Kinerja"], 0, 28, pageWidth, 14, { size: 12, bold: true, align: "center" });
  pushText(content, [`Tahun ${year}`], 0, 45, pageWidth, 12, { size: 10, bold: true, align: "center" });
  pushText(content, ["Dekan Fakultas Ilmu Komputer"], 0, 61, pageWidth, 12, { size: 10, bold: true, align: "center" });
  pushText(content, [`Halaman ${pageNumber}`], marginX, 75, tableWidth, 10, { size: 6.8, align: "right" });

  pushCell(content, colX[0], tableTop, colWidths[0], headerHeight, ["No"], { bold: true, align: "center", fill: true });
  pushCell(content, colX[1], tableTop, colWidths[1], headerHeight, ["Sasaran", "Program"], { bold: true, align: "center", fill: true });
  pushCell(content, colX[2], tableTop, colWidths[2] + colWidths[3], headerHeight, ["Indikator Kinerja Utama Wajib"], { bold: true, align: "center", fill: true });
  pushCell(content, colX[4], tableTop, colWidths[4], headerHeight, ["Satuan"], { bold: true, align: "center", fill: true });
  pushCell(content, colX[5], tableTop, colWidths[5], headerHeight, ["Target"], { bold: true, align: "center", fill: true });
  pushCell(content, colX[6], tableTop, colWidths[6], headerHeight, ["Realisasi"], { bold: true, align: "center", fill: true });
};

const pushMergedGroups = (
  content: string[],
  pageRows: PageRow[],
  key: "category" | "ikuNum",
  x: number,
  width: number,
  textForGroup: (rows: PageRow[]) => string[],
  options: { bold?: boolean; size?: number } = {}
) => {
  let start = 0;
  while (start < pageRows.length) {
    let end = start + 1;
    while (end < pageRows.length && pageRows[end].row[key] === pageRows[start].row[key]) {
      end += 1;
    }
    const groupRows = pageRows.slice(start, end);
    const top = groupRows[0].top;
    const height = groupRows.reduce((sum, item) => sum + item.height, 0);
    pushCell(content, x, top, width, height, textForGroup(groupRows), {
      bold: options.bold,
      size: options.size,
      align: "center",
      valign: "middle",
    });
    start = end;
  }
};

const pushPage = (pageRows: PageRow[], year: Year, pageNumber: number) => {
  const content: string[] = ["0.25 w", "0 g"];
  pushHeader(content, year, pageNumber);

  if (!pageRows.length) {
    pushCell(content, colX[0], tableTop + headerHeight, tableWidth, 38, [`Tidak ada indikator untuk tahun ${year}.`], {
      align: "center",
    });
    return content.join("\n");
  }

  pageRows.forEach((item) => {
    pushCell(content, colX[3], item.top, colWidths[3], item.height, item.indicatorLines, { bold: false, valign: "top" });
    pushCell(content, colX[4], item.top, colWidths[4], item.height, wrapText(item.row.unit, colWidths[4] - 8), { align: "center" });
    pushCell(content, colX[5], item.top, colWidths[5], item.height, wrapText(item.row.target, colWidths[5] - 8), { align: "center" });
    pushCell(content, colX[6], item.top, colWidths[6], item.height, wrapText(item.row.realization, colWidths[6] - 8), { align: "center" });
  });

  pushMergedGroups(content, pageRows, "category", colX[0], colWidths[0], (groupRows) => [String(groupRows[0].row.categoryNo)], {
    bold: true,
  });
  pushMergedGroups(content, pageRows, "category", colX[1], colWidths[1], (groupRows) => groupRows[0].categoryLines, {
    bold: true,
    size: 7,
  });
  pushMergedGroups(content, pageRows, "ikuNum", colX[2], colWidths[2], (groupRows) => [groupRows[0].row.ikuNum], {
    bold: true,
  });

  return content.join("\n");
};

const buildPdfBuffer = (pageContents: string[]) => {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  const pageObjectNumbers: number[] = [];
  pageContents.forEach((content) => {
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = pageObjectNumber + 1;
    pageObjectNumbers.push(pageObjectNumber);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(pageWidth)} ${fmt(pageHeight)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

  const chunks: Buffer[] = [];
  const offsets: number[] = [0];
  let byteOffset = 0;
  const write = (value: string) => {
    const chunk = Buffer.from(value, "utf8");
    chunks.push(chunk);
    byteOffset += chunk.length;
  };

  write("%PDF-1.4\n");
  objects.forEach((object, index) => {
    offsets[index + 1] = byteOffset;
    write(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = byteOffset;
  write(`xref\n0 ${objects.length + 1}\n`);
  write("0000000000 65535 f \n");
  for (let index = 1; index <= objects.length; index += 1) {
    write(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  }
  write(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.concat(chunks);
};

export const generatePerformanceContractPdf = (rows: PerformanceContractRow[], year: Year) => {
  const pdfRows = buildPdfRows(rows);
  const pages = paginateRows(pdfRows);
  const pageContents = pages.map((pageRows, index) => pushPage(pageRows, year, index + 1));
  return buildPdfBuffer(pageContents);
};
