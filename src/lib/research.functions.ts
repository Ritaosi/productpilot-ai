import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { createAiGateway, AI_MODEL } from "./ai-gateway.server";
import { clampText, extractTextFromFile } from "./extract-text.server";

const InsightsSchema = z.object({
  pain_points: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      confidence: z.number(),
    }),
  ),
  user_goals: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      confidence: z.number(),
    }),
  ),
  feature_requests: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      confidence: z.number(),
    }),
  ),
  quotes: z.array(
    z.object({
      title: z.string(),
      quote_text: z.string(),
      speaker: z.string(),
      sentiment: z.string(),
      confidence: z.number(),
    }),
  ),
});

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId?: string }) =>
    z.object({ projectId: z.string().uuid().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("research_documents").select("*").order("created_at", { ascending: false });
    if (data.projectId) q = q.eq("project_id", data.projectId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createDocumentRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        project_id: z.string().uuid(),
        file_name: z.string().min(1),
        storage_path: z.string().min(1),
        mime_type: z.string().nullable().optional(),
        size_bytes: z.number().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("research_documents")
      .insert({
        project_id: data.project_id,
        owner_id: context.userId,
        file_name: data.file_name,
        storage_path: data.storage_path,
        mime_type: data.mime_type ?? null,
        size_bytes: data.size_bytes ?? null,
        status: "uploaded",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("research_documents")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (doc?.storage_path) {
      await context.supabase.storage.from("research-files").remove([doc.storage_path]);
    }
    const { error } = await context.supabase.from("research_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const processDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: doc, error: fetchErr } = await context.supabase
      .from("research_documents")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr || !doc) throw new Error(fetchErr?.message ?? "Document not found");

    await context.supabase
      .from("research_documents")
      .update({ status: "processing", error_message: null })
      .eq("id", doc.id);

    try {
      const { data: file, error: dlErr } = await context.supabase.storage
        .from("research-files")
        .download(doc.storage_path);
      if (dlErr || !file) throw new Error(dlErr?.message ?? "Failed to download file");

      const buffer = await file.arrayBuffer();
      const rawText = await extractTextFromFile(buffer, doc.mime_type, doc.file_name);
      const text = clampText(rawText.trim());
      if (!text) throw new Error("No text could be extracted from this file.");

      const gateway = createAiGateway();
      const prompt = `You are a product research analyst. Analyze the following customer research document and extract structured insights that will help a product manager understand user needs.

Extract:
- pain_points: specific frustrations or problems users face
- user_goals: what users are ultimately trying to accomplish
- feature_requests: explicit or implicit asks for capabilities
- quotes: the most impactful verbatim quotes (short, evidence-rich)

Rules:
- Confidence is a number between 0 and 1 reflecting how strongly the document supports the insight.
- For quotes, "title" is a 3-6 word summary; "quote_text" is the exact verbatim; "speaker" is who said it (or "Unknown"); "sentiment" is one of "positive", "negative", "neutral", "mixed".
- Return at most 8 items per array. Prefer fewer high-signal items over many weak ones.
- If a category has no strong evidence, return an empty array.

DOCUMENT: ${doc.file_name}

CONTENT:
${text}`;

      let parsed: z.infer<typeof InsightsSchema> | null = null;
      try {
        const { output } = await generateText({
          model: gateway(AI_MODEL),
          output: Output.object({ schema: InsightsSchema }),
          prompt,
        });
        parsed = output;
      } catch (err) {
        if (NoObjectGeneratedError.isInstance(err)) {
          try {
            parsed = InsightsSchema.parse(JSON.parse((err as { text?: string }).text ?? "{}"));
          } catch {
            parsed = null;
          }
        } else {
          throw err;
        }
      }
      if (!parsed) throw new Error("AI returned malformed output. Try regenerating.");

      // Delete existing pending AI-generated insights from this doc, keep approved/rejected.
      await context.supabase
        .from("insights")
        .delete()
        .eq("document_id", doc.id)
        .eq("status", "pending");

      const rows = [
        ...parsed.pain_points.slice(0, 8).map((p) => ({
          kind: "pain_point" as const,
          title: p.title,
          description: p.description,
          confidence: clamp(p.confidence),
        })),
        ...parsed.user_goals.slice(0, 8).map((p) => ({
          kind: "user_goal" as const,
          title: p.title,
          description: p.description,
          confidence: clamp(p.confidence),
        })),
        ...parsed.feature_requests.slice(0, 8).map((p) => ({
          kind: "feature_request" as const,
          title: p.title,
          description: p.description,
          confidence: clamp(p.confidence),
        })),
        ...parsed.quotes.slice(0, 8).map((p) => ({
          kind: "quote" as const,
          title: p.title,
          description: null,
          quote_text: p.quote_text,
          speaker: p.speaker,
          sentiment: p.sentiment,
          confidence: clamp(p.confidence),
        })),
      ].map((r) => ({
        ...r,
        project_id: doc.project_id,
        document_id: doc.id,
        owner_id: context.userId,
        status: "pending" as const,
      }));

      if (rows.length) {
        const { error: insErr } = await context.supabase.from("insights").insert(rows);
        if (insErr) throw new Error(insErr.message);
      }

      await context.supabase
        .from("research_documents")
        .update({
          status: "processed",
          extracted_text: text.slice(0, 10000),
          error_message: null,
        })
        .eq("id", doc.id);

      return { ok: true, insights: rows.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Processing failed";
      await context.supabase
        .from("research_documents")
        .update({ status: "failed", error_message: message })
        .eq("id", doc.id);
      throw new Error(message);
    }
  });

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0.5;
  return Math.max(0, Math.min(1, Math.round(n * 100) / 100));
}
