import { IKUData, IKUDocument, Year } from "@/types";

const hasDocumentValue = (document?: IKUDocument): document is IKUDocument =>
  Boolean(document?.documentUrl || document?.documentName || document?.documentType);

export const getDocumentForYear = (
  item: Pick<IKUData, "documents" | "documentUrl" | "documentName" | "documentType">,
  year: Year
): IKUDocument => {
  const yearlyDocument = item.documents?.[year];
  if (hasDocumentValue(yearlyDocument)) return yearlyDocument;

  return {
    documentUrl: item.documentUrl,
    documentName: item.documentName,
    documentType: item.documentType,
  };
};
