import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CreateProjectInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  industry: z.string().max(200).optional().nullable(),
  target_users: z.string().max(500).optional().nullable(),
});

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateProjectInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({
        owner_id: context.userId,
        name: data.name,
        description: data.description ?? null,
        industry: data.industry ?? null,
        target_users: data.target_users ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).merge(CreateProjectInput.partial()).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { data: row, error } = await context.supabase
      .from("projects")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [projects, docs, insights, prds] = await Promise.all([
      context.supabase.from("projects").select("id", { count: "exact", head: true }),
      context.supabase.from("research_documents").select("id", { count: "exact", head: true }),
      context.supabase.from("insights").select("id, status", { count: "exact" }),
      context.supabase.from("prds").select("id", { count: "exact", head: true }),
    ]);
    const pending = (insights.data ?? []).filter((i) => i.status === "pending").length;
    const approved = (insights.data ?? []).filter((i) => i.status === "approved").length;
    return {
      projects: projects.count ?? 0,
      documents: docs.count ?? 0,
      insightsTotal: insights.count ?? 0,
      insightsPending: pending,
      insightsApproved: approved,
      prds: prds.count ?? 0,
    };
  });
