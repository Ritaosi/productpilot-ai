// Server-only text extractor for uploaded research files.
import mammoth from "mammoth";

export async function extractTextFromFile(
  buffer: ArrayBuffer,
  mime: string | null,
  fileName: string,
): Promise<string> {
  const name = fileName.toLowerCase();
  const buf = Buffer.from(buffer);

  if (name.endsWith(".txt") || mime?.startsWith("text/")) {
    return buf.toString("utf-8");
  }
  if (name.endsWith(".docx") || mime?.includes("officedocument.wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value ?? "";
  }
  if (name.endsWith(".pdf") || mime === "application/pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : (text as string);
  }
  // Fallback: try as UTF-8 text
  return buf.toString("utf-8");
}

export function clampText(text: string, maxChars = 40000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[... truncated ...]";
}
