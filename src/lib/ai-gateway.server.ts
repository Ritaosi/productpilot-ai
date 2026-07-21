import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createAiGateway() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  return createOpenAICompatible({
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    supportsStructuredOutputs: true,
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });
}

export const AI_MODEL = "openai/gpt-oss-120b";
