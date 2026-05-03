import path from "node:path";

export const documentUploadDir = () =>
  process.env.IKU_DOCUMENT_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads", "iku-documents");

export const safeDocumentFilename = (filename: string) => {
  const normalized = path.basename(filename || "");
  if (!normalized || normalized !== filename || !/^[a-zA-Z0-9._-]+$/.test(normalized)) return null;
  return normalized;
};

export const documentPath = (filename: string) => path.join(documentUploadDir(), filename);

export const documentPublicUrl = (filename: string) => `/uploads/iku-documents/${filename}`;

export const documentContentType = (filename: string) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".csv") return "text/csv; charset=utf-8";
  return "application/octet-stream";
};
