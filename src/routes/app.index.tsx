import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FolderKanban, FileSearch, Lightbulb, ListChecks, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-bits";
import { listProjects, getDashboardStats } from "@/lib/projects.functions";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — ProductPilot AI" }] }),
});

function Dashboard() {
  const statsFn = useServerFn(getDashboardStats);
  const projectsFn = useServerFn(listProjects);
  const stats = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => statsFn() });
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => projectsFn() });

  const cards = [
    { label: "Projects", value: stats.data?.projects ?? 0, icon: FolderKanban },
    { label: "Research documents", value: stats.data?.documents ?? 0, icon: FileSearch },
    { label: "Insights", value: stats.data?.insightsTotal ?? 0, icon: Lightbulb, sub: `${stats.data?.insightsApproved ?? 0} approved` },
    { label: "Pending review", value: stats.data?.insightsPending ?? 0, icon: ListChecks },
    { label: "PRDs", value: stats.data?.prds ?? 0, icon: FileText },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Your AI-powered product discovery workspace."
        actions={
          <Button asChild>
            <Link to="/app/projects">Go to projects <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((s) => (
          <Card key={s.label} className="border-border/70">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-2xl font-bold tabular-nums">{s.value}</div>
                  {s.sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</div>}
                </div>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent projects</CardTitle>
            <CardDescription>Jump back into your product discovery work</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/projects">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(projects.data ?? []).slice(0, 5).map((p) => (
            <Link
              key={p.id}
              to="/app/projects/$id"
              params={{ id: p.id }}
              className="block rounded-lg border p-3 transition hover:border-primary/50 hover:bg-muted/40"
            >
              <div className="truncate text-sm font-semibold">{p.name}</div>
              {p.description && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</div>}
            </Link>
          ))}
          {!projects.isLoading && (projects.data?.length ?? 0) === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No projects yet. <Link to="/app/projects" className="text-primary hover:underline">Create your first project</Link>.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

