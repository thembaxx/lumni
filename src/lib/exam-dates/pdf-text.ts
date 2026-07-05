import { PDFParse } from "pdf-parse";

export interface PdfExtractResult {
  text: string;
  pageCount: number;
}

export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<PdfExtractResult> {
  let pdf: PDFParse | null = null;
  try {
    pdf = new PDFParse({ data: pdfBuffer });
    const [textResult, info] = await Promise.all([pdf.getText(), pdf.getInfo()]);
    const pageCount = info?.total ?? 1;
    return { text: textResult.text, pageCount };
  } finally {
    try {
      await pdf?.destroy();
    } catch {
      // ignore cleanup errors
    }
  }
}
