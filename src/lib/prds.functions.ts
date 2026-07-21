import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { createAiGateway, AI_MODEL } from "./ai-gateway.server";

const PRDSectionsSchema = z.object({
  problem_statement: z.string(),
  background: z.string(),
  goals: z.array(z.string()),
  non_goals: z.array(z.string()),
  target_users: z.string(),
  user_stories: z.array(z.string()),
  functional_requirements: z.array(z.string()),
  acceptance_criteria: z.array(z.string()),
  success_metrics: z.array(z.string()),
  risks: z.string(),
});
export type PRDSections = z.infer<typeof PRDSectionsSchema>;

export const listPRDs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) =>
    z.object({ projectId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("prds")
      .select("*")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPRD = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("prds")
      .select("*, opportunities(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

async function generateSections(
  gateway: ReturnType<typeof createAiGateway>,
  prompt: string,
): Promise<PRDSections> {
  try {
    const { output } = await generateText({
      model: gateway(AI_MODEL),
      output: Output.object({ schema: PRDSectionsSchema }),
      prompt,
    });
    return output;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      const parsed = PRDSectionsSchema.safeParse(JSON.parse((err as { text?: string }).text ?? "{}"));
      if (parsed.success) return parsed.data;
    }
    throw err;
  }
}

export const generatePRDFromOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ opportunityId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase
      .from("opportunities")
      .select("*, projects(name, description, target_users)")
      .eq("id", data.opportunityId)
      .maybeSingle();
    if (!opp) throw new Error("Opportunity not found");

    const insightIds = (opp.source_insight_ids ?? []) as string[];
    const { data: insightsRows } = insightIds.length
      ? await context.supabase.from("insights").select("kind, title, description, quote_text").in("id", insightIds)
      : { data: [] as { kind: string; title: string; description: string | null; quote_text: string | null }[] };

    const evidence = (insightsRows ?? [])
      .map(
        (i) =>
          `- (${i.kind}) ${i.title}${i.description ? `: ${i.description}` : ""}${
            i.quote_text ? ` — "${i.quote_text}"` : ""
          }`,
      )
      .join("\n");

    const project = Array.isArray(opp.projects) ? opp.projects[0] : opp.projects;
    const gateway = createAiGateway();
    const sections = await generateSections(
      gateway,
      `You are a senior product manager drafting a PRD (Product Requirements Document).

Project: ${project?.name ?? ""}
${project?.description ? `Product context: ${project.description}` : ""}
${project?.target_users ? `Target audience: ${project.target_users}` : ""}

OPPORTUNITY
Title: ${opp.title}
Problem: ${opp.problem ?? ""}
Target user: ${opp.target_user ?? ""}
Value proposition: ${opp.value_prop ?? ""}

SUPPORTING RESEARCH EVIDENCE
${evidence || "(no linked insights)"}

Write a concise, professional PRD. Every list should have 3-6 items. User stories should follow "As a [user], I want [action], so that [outcome]." format. Acceptance criteria should be testable. Success metrics should be measurable.`,
    );

    const { data: row, error } = await context.supabase
      .from("prds")
      .insert({
        project_id: opp.project_id,
        opportunity_id: opp.id,
        owner_id: context.userId,
        title: opp.title,
        status: "draft",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sections: sections as any,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const regeneratePRDSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ prdId: z.string().uuid(), section: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: prd } = await context.supabase
      .from("prds")
      .select("*, opportunities(*)")
      .eq("id", data.prdId)
      .maybeSingle();
    if (!prd) throw new Error("PRD not found");

    const opp = Array.isArray(prd.opportunities) ? prd.opportunities[0] : prd.opportunities;
    const currentSections = prd.sections as Record<string, unknown>;
    const gateway = createAiGateway();

    const isArrayField = ["goals", "non_goals", "user_stories", "functional_requirements", "acceptance_criteria", "success_metrics"].includes(
      data.section,
    );

    const prompt = `You are drafting the "${data.section}" section of a PRD.

PRD title: ${prd.title}
Opportunity: ${opp?.title ?? prd.title}
Problem: ${opp?.problem ?? ""}
Value prop: ${opp?.value_prop ?? ""}

Existing PRD context (for consistency):
${JSON.stringify(currentSections, null, 2).slice(0, 3000)}

Return ONLY a JSON object with the single key "${data.section}" containing ${
      isArrayField ? "an array of 3-6 short strings" : "a concise string (2-4 sentences)"
    }. Do not wrap in markdown or add commentary.`;

    const { text } = await generateText({
      model: gateway(AI_MODEL),
      prompt,
    });

    // Best-effort JSON parse
    let value: unknown = null;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) value = JSON.parse(match[0])[data.section];
    } catch {
      value = null;
    }
    if (value === null || value === undefined) {
      value = isArrayField ? text.split(/\n+/).map((s: string) => s.replace(/^[-*\d.\s]+/, "").trim()).filter(Boolean).slice(0, 6) : text.trim();
    }

    const newSections = { ...currentSections, [data.section]: value };
    const { data: row, error } = await context.supabase
      .from("prds")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ sections: newSections as any })
      .eq("id", data.prdId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updatePRD = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        status: z.enum(["draft", "in_review", "approved"]).optional(),
        sections: z.record(z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { data: row, error } = await context.supabase
      .from("prds")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(rest as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePRD = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("prds").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
