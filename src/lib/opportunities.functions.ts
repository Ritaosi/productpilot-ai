import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { createAiGateway, AI_MODEL } from "./ai-gateway.server";

const OppsSchema = z.object({
  opportunities: z.array(
    z.object({
      title: z.string(),
      problem: z.string(),
      target_user: z.string(),
      value_prop: z.string(),
      source_insight_indexes: z.array(z.coerce.number()),
    }),
  ),
});

export const listOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) =>
    z.object({ projectId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("opportunities")
      .select("*")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const generateOpportunities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ projectId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: project } = await context.supabase
      .from("projects")
      .select("*")
      .eq("id", data.projectId)
      .maybeSingle();
    if (!project) throw new Error("Project not found");

    const { data: approved, error } = await context.supabase
      .from("insights")
      .select("id, kind, title, description")
      .eq("project_id", data.projectId)
      .eq("status", "approved")
      .neq("kind", "quote");
    if (error) throw new Error(error.message);
    if (!approved || approved.length < 2) {
      throw new Error("Approve at least 2 insights before generating opportunities.");
    }

    const list = approved
      .map((i, idx) => `[${idx}] (${i.kind}) ${i.title}${i.description ? `: ${i.description}` : ""}`)
      .join("\n");

    const gateway = createAiGateway();
    let parsed: z.infer<typeof OppsSchema> | null = null;
    try {
      const { output } = await generateText({
        model: gateway(AI_MODEL),
        output: Output.object({ schema: OppsSchema }),
        prompt: `You are a senior product manager. Cluster the following approved research insights into 3 to 6 concrete product opportunities.

Project: ${project.name}
${project.description ? `Description: ${project.description}` : ""}
${project.target_users ? `Target users: ${project.target_users}` : ""}

Approved insights:
${list}

Rules:
- Each opportunity should be a focused problem/solution area, not a vague theme.
- source_insight_indexes lists the [index] numbers from above that inform this opportunity.
- value_prop should describe what the user gains, in one sentence.
- Return 3 to 6 opportunities. No duplicates.`,
      });
      parsed = output;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        try {
          parsed = OppsSchema.parse(JSON.parse(err.text ?? "{}"));
        } catch {
          parsed = null;
        }
      } else {
        throw err;
      }
    }
    if (!parsed) throw new Error("AI returned malformed output.");

    // Delete previous "proposed" opportunities so regenerate replaces them.
    await context.supabase
      .from("opportunities")
      .delete()
      .eq("project_id", data.projectId)
      .eq("status", "proposed");

    const opps = parsed.opportunities.slice(0, 6).map((o) => ({
      project_id: data.projectId,
      owner_id: context.userId,
      title: o.title,
      problem: o.problem,
      target_user: o.target_user,
      value_prop: o.value_prop,
      source_insight_ids: o.source_insight_indexes
        .map((i) => approved[i]?.id)
        .filter((v): v is string => !!v),
      status: "proposed" as const,
    }));

    if (opps.length) {
      const { error: insErr } = await context.supabase.from("opportunities").insert(opps);
      if (insErr) throw new Error(insErr.message);
    }
    return { count: opps.length };
  });

export const updateOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        problem: z.string().nullable().optional(),
        target_user: z.string().nullable().optional(),
        value_prop: z.string().nullable().optional(),
        status: z.string().optional(),
        reach: z.number().nullable().optional(),
        impact: z.number().nullable().optional(),
        confidence: z.number().nullable().optional(),
        effort: z.number().nullable().optional(),
        moscow: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { data: row, error } = await context.supabase
      .from("opportunities")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("opportunities").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
