import ky from "ky";
import * as pdf from "pdf-parse";

/**
 * Downloads a PDF file from a given storage URL, parses it,
 * and extracts all clean text content.
 * 
 * @param storageUrl The URL to download the PDF from.
 * @returns The extracted plain text content of the PDF.
 */
export async function extractTextFromPdf(storageUrl: string): Promise<string> {
  try {
    const response = await ky.get(storageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedData = await (pdf as any)(buffer);
    return parsedData.text || "";
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(
      `Failed to parse PDF content: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
