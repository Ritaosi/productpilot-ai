import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { createAiGateway, AI_MODEL } from "./ai-gateway.server";

const FIRECRAWL_URL = "https://api.firecrawl.dev/v2";

const SignalSchema = z.object({
  competitors: z.array(
    z.object({
      name: z.string(),
      positioning: z.string(),
      momentum: z.enum(["up", "down", "flat"]),
      recentMoves: z.array(
        z.object({
          date: z.string(),
          headline: z.string(),
          source: z.string(),
          url: z.string(),
        }),
      ),
      threats: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
  ),
  overlaps: z.array(
    z.object({
      competitor: z.string(),
      move: z.string(),
      overlapsWith: z.string(),
      sourceUrl: z.string(),
      severity: z.enum(["high", "medium", "low"]),
    }),
  ),
  whitespace: z.array(
    z.object({
      gap: z.string(),
      mapsTo: z.string(),
    }),
  ),
  summary: z.string(),
});

type SearchResult = { title?: string; url?: string; description?: string; markdown?: string };

async function firecrawlSearch(query: string): Promise<SearchResult[]> {
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!fcKey) throw new Error("Firecrawl connector not configured");
  const res = await fetch(`${FIRECRAWL_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fcKey}`,
    },
    body: JSON.stringify({ query, limit: 6, tbs: "qdr:y" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl search failed [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as { data?: { web?: unknown } | unknown; web?: unknown };
  const data =
    (json.data && typeof json.data === "object" && "web" in json.data
      ? (json.data as { web?: unknown }).web
      : json.data) ?? json.web ?? [];
  return Array.isArray(data) ? (data as SearchResult[]) : [];
}

export const suggestCompetitors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) =>
    z.object({ projectId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const [{ data: project }, { data: opps }, { data: prds }] = await Promise.all([
      context.supabase
        .from("projects")
        .select("name, description, target_users")
        .eq("id", data.projectId)
        .maybeSingle(),
      context.supabase
        .from("opportunities")
        .select("title, problem, value_prop")
        .eq("project_id", data.projectId)
        .limit(15),
      context.supabase
        .from("prds")
        .select("title, sections")
        .eq("project_id", data.projectId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (!project) throw new Error("Project not found");

    const oppList = (opps ?? [])
      .map((o) => `- ${o.title}${o.problem ? ` (problem: ${o.problem})` : ""}`)
      .join("\n") || "(none yet)";
    const prd = prds?.[0];
    const prdSnippet = prd ? JSON.stringify(prd.sections).slice(0, 1200) : "";

    const prompt = `Suggest 5 real, well-known competitor products for the following product. Only include companies that actually exist and are searchable by name in the news. Do NOT invent names.

PRODUCT: ${project.name}
DESCRIPTION: ${project.description ?? "(none)"}
TARGET USERS: ${project.target_users ?? "(unspecified)"}

WHAT WE'RE BUILDING (opportunities):
${oppList}

${prdSnippet ? `PRD EXCERPT:\n${prdSnippet}` : ""}

Return 5 competitors ordered from most direct to more adjacent. For each: a short "why" (max 12 words) explaining why they compete.`;

    const gateway = createAiGateway();
    const model = gateway(AI_MODEL);
    const schema = z.object({
      competitors: z
        .array(z.object({ name: z.string(), why: z.string() }))
        .min(1)
        .max(6),
    });

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema }),
        prompt,
      });
      return { ok: true as const, competitors: output.competitors };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return { ok: false as const, error: "Could not generate suggestions", competitors: [] };
      }
      throw error;
    }
  });

export const getLatestScan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) =>
    z.object({ projectId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("competitive_scans")
      .select("id, competitors, payload, created_at")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    return rows?.[0] ?? null;
  });

export const refreshCompetitiveIntel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string; competitors: string[] }) =>
    z
      .object({
        projectId: z.string().uuid(),
        competitors: z.array(z.string().min(1)).min(1).max(6),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Pull project context
    const [{ data: project }, { data: opps }, { data: prds }] = await Promise.all([
      context.supabase
        .from("projects")
        .select("name, description, target_users")
        .eq("id", data.projectId)
        .maybeSingle(),
      context.supabase
        .from("opportunities")
        .select("title, problem, value_prop")
        .eq("project_id", data.projectId)
        .limit(20),
      context.supabase
        .from("prds")
        .select("title, sections")
        .eq("project_id", data.projectId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    // Fetch fresh news per competitor in parallel
    const results = await Promise.all(
      data.competitors.map(async (name) => {
        try {
          const hits = await firecrawlSearch(`${name} product launch OR pricing OR funding OR release`);
          return { name, hits };
        } catch (e) {
          return { name, hits: [] as SearchResult[], error: (e as Error).message };
        }
      }),
    );

    const corpus = results
      .map(
        (r) =>
          `## ${r.name}\n` +
          (r.hits.length === 0
            ? "(no recent results)\n"
            : r.hits
                .slice(0, 6)
                .map(
                  (h, i) =>
                    `${i + 1}. ${h.title ?? "Untitled"} — ${h.description ?? ""}\nURL: ${h.url ?? ""}`,
                )
                .join("\n")),
      )
      .join("\n\n");

    const oppList = (opps ?? [])
      .map((o, i) => `${i + 1}. ${o.title}${o.problem ? ` — problem: ${o.problem}` : ""}${o.value_prop ? ` — value: ${o.value_prop}` : ""}`)
      .join("\n") || "(no approved opportunities yet)";

    const prd = prds?.[0];
    const prdBlock = prd
      ? `PRD "${prd.title}":\n${JSON.stringify(prd.sections).slice(0, 2000)}`
      : "(no PRD yet)";

    const productName = project?.name ?? "our product";

    const prompt = `You are a competitive intelligence analyst for "${productName}"${
      project?.description ? ` (${project.description})` : ""
    }. Compare what competitors are doing to what WE are planning to build, then produce a structured brief.

OUR PLANNED OPPORTUNITIES:
${oppList}

OUR LATEST PRD:
${prdBlock}

COMPETITOR SEARCH RESULTS (past year, from Firecrawl):
${corpus}

Produce:
1. For each competitor: positioning (1 sentence), momentum (up/down/flat), recentMoves (up to 4 concrete moves with source publication name and REAL URL from results — never invent), threats (1-3), gaps (1-3).
2. overlaps: competitor moves that DIRECTLY compete with our planned opportunities or PRD user stories. For each, name the competitor, the move, which of our opportunities/stories it overlaps with (quote the title), the source URL, and severity.
3. whitespace: gaps in the competitive landscape that map to one of our opportunities — quote the opportunity title in mapsTo.
4. summary: 2 sentences on how our roadmap stacks up against current market moves.

If a competitor has no fresh results, include them with empty recentMoves and note it in positioning. If there are no overlaps or whitespace items, return empty arrays.`;

    const gateway = createAiGateway();
    const model = gateway(AI_MODEL);

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: SignalSchema }),
        prompt,
      });
      const fetchedAt = new Date().toISOString();
      const payload = { ...output, fetchedAt };

      await context.supabase.from("competitive_scans").insert({
        project_id: data.projectId,
        owner_id: context.userId,
        competitors: data.competitors,
        payload,
      });

      return { ok: true as const, ...payload };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return {
          ok: false as const,
          error: "Model returned malformed output",
          competitors: [],
          overlaps: [],
          whitespace: [],
          summary: "",
          fetchedAt: new Date().toISOString(),
        };
      }
      throw error;
    }
  });
