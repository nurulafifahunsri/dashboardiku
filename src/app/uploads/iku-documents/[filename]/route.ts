import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { documentContentType, documentPath, safeDocumentFilename } from "@/lib/ikuDocuments";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const safeFilename = safeDocumentFilename(filename);

  if (!safeFilename) {
    return NextResponse.json({ message: "Nama dokumen tidak valid" }, { status: 400 });
  }

  try {
    const filePath = documentPath(safeFilename);
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ message: "Dokumen tidak ditemukan" }, { status: 404 });
    }

    const file = await readFile(filePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": documentContentType(safeFilename),
        "Content-Length": String(file.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${safeFilename}"`,
      },
    });
  } catch {
    return NextResponse.json({ message: "Dokumen tidak ditemukan" }, { status: 404 });
  }
}
