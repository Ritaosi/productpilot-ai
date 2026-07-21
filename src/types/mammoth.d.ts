declare module "mammoth" {
  export function extractRawText(input: { buffer: Buffer }): Promise<{ value: string; messages: unknown[] }>;
  const _default: { extractRawText: typeof extractRawText };
  export default _default;
}
