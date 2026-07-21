import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIBadge } from "@/components/ui-bits";
import {
  TrendingUp, TrendingDown, Minus, Radar, ExternalLink, AlertTriangle,
  RefreshCw, Loader2, Target, Sparkles, Shield, Zap, Clock, Radio, Wand2, X, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { refreshCompetitiveIntel, getLatestScan, suggestCompetitors } from "@/lib/competitive.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/competitive")({
  component: CompetitivePage,
  head: () => ({ meta: [{ title: "Competitive Intel — ProductPilot AI" }] }),
});

type Trend = "up" | "down" | "flat";
type Competitor = {
  name: string;
  positioning: string;
  momentum: Trend;
  recentMoves: { date: string; headline: string; source: string; url?: string }[];
  threats: string[];
  gaps: string[];
};
type Overlap = { competitor: string; move: string; overlapsWith: string; sourceUrl: string; severity: "high" | "medium" | "low" };
type Whitespace = { gap: string; mapsTo: string };
type Payload = {
  competitors: Competitor[];
  overlaps: Overlap[];
  whitespace: Whitespace[];
  summary: string;
  fetchedAt: string;
};

function trendMeta(t: Trend) {
  if (t === "up") return { icon: TrendingUp, label: "Gaining", cls: "text-destructive bg-destructive/10 border-destructive/20" };
  if (t === "down") return { icon: TrendingDown, label: "Losing", cls: "text-success bg-success/10 border-success/20" };
  return { icon: Minus, label: "Steady", cls: "text-muted-foreground bg-muted border-border" };
}

function sevMeta(s: Overlap["severity"]) {
  if (s === "high") return { dot: "bg-destructive", ring: "ring-destructive/30", label: "Critical" };
  if (s === "medium") return { dot: "bg-amber-500", ring: "ring-amber-500/30", label: "Watch" };
  return { dot: "bg-muted-foreground", ring: "ring-muted", label: "Low" };
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function CompetitivePage() {
  const refresh = useServerFn(refreshCompetitiveIntel);
  const fetchScan = useServerFn(getLatestScan);
  const suggest = useServerFn(suggestCompetitors);

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [addInput, setAddInput] = useState("");
  const [suggestions, setSuggestions] = useState<{ name: string; why: string }[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCompetitor, setActiveCompetitor] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("projects").select("id, name").order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = data ?? [];
        setProjects(list);
        if (list[0]) setProjectId(list[0].id);
      });
  }, []);

  const scanQuery = useQuery({
    queryKey: ["competitive-scan", projectId],
    queryFn: () => fetchScan({ data: { projectId: projectId! } }),
    enabled: !!projectId,
  });

  const contextQuery = useQuery({
    queryKey: ["competitive-context", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const [opps, prds] = await Promise.all([
        supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("project_id", projectId!),
        supabase.from("prds").select("id", { count: "exact", head: true }).eq("project_id", projectId!),
      ]);
      return { opps: opps.count ?? 0, prds: prds.count ?? 0 };
    },
  });
  const thinContext = contextQuery.data && contextQuery.data.opps === 0 && contextQuery.data.prds === 0;

  const cached = scanQuery.data as { competitors: string[]; payload: Payload; created_at: string } | null | undefined;
  const payload: Payload | null = cached?.payload ?? null;

  useEffect(() => {
    if (cached?.competitors?.length) setNames(cached.competitors);
    else setNames([]);
    setSuggestions([]);
  }, [projectId, cached?.competitors]);

  useEffect(() => {
    if (payload?.competitors?.[0] && !activeCompetitor) {
      setActiveCompetitor(payload.competitors[0].name);
    }
  }, [payload, activeCompetitor]);

  const addName = (n: string) => {
    const clean = n.trim();
    if (!clean) return;
    setNames((prev) => (prev.includes(clean) || prev.length >= 6 ? prev : [...prev, clean]));
    setSuggestions((prev) => prev.filter((s) => s.name !== clean));
  };
  const removeName = (n: string) => setNames((prev) => prev.filter((x) => x !== n));

  const handleSuggest = async () => {
    if (!projectId) return toast.error("Select a project first");
    setSuggesting(true);
    try {
      const res = await suggest({ data: { projectId } });
      if (!res.ok || !res.competitors.length) toast.error(res.error ?? "No suggestions returned");
      else {
        setSuggestions(res.competitors.filter((c) => !names.includes(c.name)));
        toast.success(`Suggested ${res.competitors.length} competitors`);
      }
    } catch (e) { toast.error((e as Error).message); }
    finally { setSuggesting(false); }
  };

  const handleRefresh = async () => {
    if (!projectId) return toast.error("Select a project first");
    if (!names.length) return toast.error("Add at least one competitor");
    setLoading(true);
    try {
      const res = await refresh({ data: { projectId, competitors: names.slice(0, 6) } });
      if (!res.ok) toast.error(res.error ?? "Refresh failed");
      else {
        toast.success(`Scanned ${res.competitors.length} competitors — ${res.overlaps.length} overlaps found`);
        scanQuery.refetch();
      }
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };

  const competitors = payload?.competitors ?? [];
  const overlaps = payload?.overlaps ?? [];
  const whitespace = payload?.whitespace ?? [];
  const summary = payload?.summary ?? "";
  const fetchedAt = payload?.fetchedAt ?? cached?.created_at ?? null;

  const highSev = overlaps.filter((o) => o.severity === "high").length;
  const gaining = competitors.filter((c) => c.momentum === "up").length;

  const timeline = useMemo(() => {
    const items: (Competitor["recentMoves"][number] & { competitor: string; momentum: Trend })[] = [];
    competitors.forEach((c) => c.recentMoves.forEach((m) => items.push({ ...m, competitor: c.name, momentum: c.momentum })));
    return items.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 12);
  }, [competitors]);

  const active = competitors.find((c) => c.name === activeCompetitor) ?? competitors[0];

  return (
    <div className="space-y-6">
      {/* Command bar */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--primary)/0.15)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
              <Radio className="h-3.5 w-3.5 animate-pulse" /> Live signal feed
              <AIBadge />
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Competitive radar</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Autonomous agent scans the web for competitor moves and cross-references them against your approved opportunities and PRD.
            </p>
            {fetchedAt && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> Last scan {timeAgo(fetchedAt)} · {new Date(fetchedAt).toLocaleString()}
              </div>
            )}
          </div>
          <div className="w-full lg:w-[420px] space-y-2">
            <Select value={projectId ?? undefined} onValueChange={setProjectId}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="rounded-lg border bg-background p-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {names.map((n) => (
                  <span key={n} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {n}
                    <button onClick={() => removeName(n)} className="hover:text-destructive" aria-label={`Remove ${n}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addName(addInput);
                      setAddInput("");
                    } else if (e.key === "Backspace" && !addInput && names.length) {
                      removeName(names[names.length - 1]);
                    }
                  }}
                  placeholder={names.length ? "Add another…" : "Type a competitor and press Enter"}
                  className="flex-1 min-w-[140px] bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSuggest}
                disabled={suggesting || !projectId}
                className="flex-1 gap-2"
              >
                {suggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {suggesting ? "Thinking" : "Suggest with AI"}
              </Button>
              <Button onClick={handleRefresh} disabled={loading || !projectId || !names.length} className="flex-1 gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {loading ? "Scanning" : "Scan signals"}
              </Button>
            </div>

            {suggestions.length > 0 && (
              <div className="rounded-lg border bg-background/80 p-2">
                <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> AI suggestions
                </div>
                <div className="space-y-1">
                  {suggestions.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => addName(s.name)}
                      className="flex w-full items-start justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{s.name}</div>
                        <div className="truncate text-muted-foreground">{s.why}</div>
                      </div>
                      <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {thinContext && projectId && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="text-xs">
            <div className="font-semibold text-foreground">Thin project context</div>
            <div className="mt-0.5 text-muted-foreground">
              This project has no opportunities or PRDs yet, so the agent can't cross-reference competitor moves against your roadmap. You'll still get recent moves and generic threats — add opportunities or draft a PRD to unlock overlap detection.
            </div>
          </div>
        </div>
      )}

      {!payload && !scanQuery.isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="rounded-full bg-primary/10 p-3"><Radar className="h-6 w-6 text-primary" /></div>
            <div className="text-sm font-medium">No scans yet for this project</div>
            <div className="max-w-sm text-xs text-muted-foreground">
              Hit <span className="font-medium text-foreground">Scan</span> to launch the Competitive Intel Agent. It'll pull fresh news and match it against your roadmap.
            </div>
          </CardContent>
        </Card>
      )}

      {payload && (
        <>
          {/* Threat level bar */}
          <div className="grid gap-3 md:grid-cols-4">
            <StatTile icon={AlertTriangle} label="Critical overlaps" value={highSev} tone="destructive" hint={`${overlaps.length} total`} />
            <StatTile icon={Target} label="Whitespace bets" value={whitespace.length} tone="success" hint="Gaps competitors miss" />
            <StatTile icon={TrendingUp} label="Gaining momentum" value={gaining} tone="warning" hint={`of ${competitors.length} tracked`} />
            <StatTile icon={Shield} label="Threat level" value={highSev >= 3 ? "High" : highSev >= 1 ? "Medium" : "Low"} tone={highSev >= 3 ? "destructive" : highSev >= 1 ? "warning" : "success"} hint="Based on overlap severity" />
          </div>

          {/* AI snapshot */}
          {summary && (
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2"><Sparkles className="h-4 w-4 text-primary" /></div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">Agent briefing</div>
                  <p className="mt-1 text-sm leading-relaxed">{summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Split view: threats vs whitespace */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-destructive/10 p-1.5"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
                  <div>
                    <div className="text-sm font-semibold">Roadmap overlaps</div>
                    <div className="text-xs text-muted-foreground">Where competitors are chasing what you're building</div>
                  </div>
                </div>
                <Badge variant="outline">{overlaps.length}</Badge>
              </div>
              <div className="divide-y">
                {overlaps.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No overlaps detected — you're in clear air.</div>}
                {overlaps.map((o, i) => {
                  const sv = sevMeta(o.severity);
                  return (
                    <div key={i} className="group p-4 transition-colors hover:bg-muted/40">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4 ${sv.dot} ${sv.ring}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-foreground">{o.competitor}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground uppercase tracking-wider">{sv.label}</span>
                          </div>
                          <div className="mt-1 text-sm">{o.move}</div>
                          <div className="mt-2 flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1 text-xs">
                            <Zap className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-muted-foreground shrink-0">Collides with</span>
                            <span className="truncate font-medium">{o.overlapsWith}</span>
                          </div>
                          {o.sourceUrl && (
                            <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                              Read source <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-success/10 p-1.5"><Target className="h-4 w-4 text-success" /></div>
                  <div>
                    <div className="text-sm font-semibold">Whitespace to claim</div>
                    <div className="text-xs text-muted-foreground">Gaps competitors ignore — that map to your plan</div>
                  </div>
                </div>
                <Badge variant="outline">{whitespace.length}</Badge>
              </div>
              <div className="divide-y">
                {whitespace.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No whitespace opportunities identified yet.</div>}
                {whitespace.map((w, i) => (
                  <div key={i} className="p-4 transition-colors hover:bg-muted/40">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-md bg-success/10 p-1"><Target className="h-3 w-3 text-success" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-snug">{w.gap}</div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>Maps to</span>
                          <span className="rounded bg-success/10 px-1.5 py-0.5 font-medium text-success">{w.mapsTo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Competitor deep-dive + timeline */}
          <Tabs defaultValue="deep-dive" className="w-full">
            <TabsList>
              <TabsTrigger value="deep-dive">Competitor deep-dive</TabsTrigger>
              <TabsTrigger value="timeline">Signal timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="deep-dive" className="mt-4">
              <div className="grid gap-4 lg:grid-cols-[240px,1fr]">
                <div className="space-y-1.5">
                  {competitors.map((c) => {
                    const tm = trendMeta(c.momentum);
                    const Icon = tm.icon;
                    const isActive = c.name === active?.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => setActiveCompetitor(c.name)}
                        className={`w-full rounded-lg border p-3 text-left transition-all ${isActive ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40 hover:bg-muted/40"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-semibold">{c.name}</div>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] ${tm.cls}`}>
                            <Icon className="h-2.5 w-2.5" />
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">{c.recentMoves.length} signals · {tm.label}</div>
                      </button>
                    );
                  })}
                </div>

                {active && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold">{active.name}</h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">{active.positioning}</p>
                        </div>
                        {(() => {
                          const tm = trendMeta(active.momentum);
                          const Icon = tm.icon;
                          return (
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tm.cls}`}>
                              <Icon className="h-3 w-3" /> {tm.label}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="grid gap-5 md:grid-cols-3">
                        <Column icon={Radio} title="Recent moves" tone="primary">
                          {active.recentMoves.length === 0 && <li className="text-xs text-muted-foreground">No fresh signals.</li>}
                          {active.recentMoves.map((m, i) => (
                            <li key={i} className="rounded-md border bg-background p-2.5">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.date} · {m.source}</div>
                              <div className="mt-0.5 text-sm leading-snug">{m.headline}</div>
                              {m.url && (
                                <a href={m.url} target="_blank" rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                                  Source <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </li>
                          ))}
                        </Column>
                        <Column icon={AlertTriangle} title="Threats to us" tone="destructive">
                          {active.threats.map((t, i) => (
                            <li key={i} className="flex gap-2 text-sm"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive" />{t}</li>
                          ))}
                        </Column>
                        <Column icon={Target} title="Gaps we exploit" tone="success">
                          {active.gaps.map((g, i) => (
                            <li key={i} className="flex gap-2 text-sm"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-success" />{g}</li>
                          ))}
                        </Column>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {timeline.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">No signals to display.</div>
                  ) : (
                    <ol className="relative space-y-4 border-l-2 border-border pl-6">
                      {timeline.map((m, i) => (
                        <li key={i} className="relative">
                          <span className="absolute -left-[29px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-primary" />
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="font-mono">{m.date}</span>
                            <Badge variant="outline" className="text-[10px]">{m.competitor}</Badge>
                            <span>· {m.source}</span>
                          </div>
                          <div className="mt-1 text-sm">{m.headline}</div>
                          {m.url && (
                            <a href={m.url} target="_blank" rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                              Source <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone, hint }: {
  icon: React.ElementType; label: string; value: string | number; tone: "destructive" | "success" | "warning" | "primary"; hint?: string;
}) {
  const toneCls = {
    destructive: "text-destructive bg-destructive/10",
    success: "text-success bg-success/10",
    warning: "text-amber-600 bg-amber-500/10",
    primary: "text-primary bg-primary/10",
  }[tone];
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`rounded-md p-1.5 ${toneCls}`}><Icon className="h-3.5 w-3.5" /></div>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Column({ icon: Icon, title, tone, children }: {
  icon: React.ElementType; title: string; tone: "primary" | "destructive" | "success"; children: React.ReactNode;
}) {
  const toneCls = { primary: "text-primary", destructive: "text-destructive", success: "text-success" }[tone];
  return (
    <div>
      <div className={`mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${toneCls}`}>
        <Icon className="h-3 w-3" /> {title}
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}
