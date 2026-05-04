import { IKUData, IKUDocument, Year } from "@/types";

const hasDocumentValue = (document?: IKUDocument): document is IKUDocument =>
  Boolean(document?.documentUrl || document?.documentName || document?.documentType);

export const getDocumentForYear = (
  item: Pick<IKUData, "documents">,
  year: Year
): IKUDocument => {
  const yearlyDocument = item.documents?.[year];
  if (hasDocumentValue(yearlyDocument)) return yearlyDocument;

  return {};
};
