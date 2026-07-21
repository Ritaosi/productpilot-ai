import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  UploadCloud,
  FileText as FileIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Lightbulb,
  ListChecks,
  FileText,
  MessageSquareQuote,
  Target,
  Wand2,
  Save,
  Pencil,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIBadge, ConfidenceBar, EmptyState } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { getProject } from "@/lib/projects.functions";
import {
  listDocuments,
  createDocumentRecord,
  deleteDocument,
  processDocument,
} from "@/lib/research.functions";
import { listInsights, updateInsight, deleteInsight } from "@/lib/insights.functions";
import {
  listOpportunities,
  generateOpportunities,
  updateOpportunity,
  deleteOpportunity,
} from "@/lib/opportunities.functions";
import {
  listPRDs,
  generatePRDFromOpportunity,
  updatePRD,
  deletePRD,
  regeneratePRDSection,
} from "@/lib/prds.functions";

export const Route = createFileRoute("/app/projects/$id")({
  component: ProjectDetail,
  head: () => ({ meta: [{ title: "Project — ProductPilot AI" }] }),
});

const INSIGHT_KIND_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  pain_point: { label: "Pain point", icon: AlertCircle },
  user_goal: { label: "User goal", icon: Target },
  feature_request: { label: "Feature request", icon: Lightbulb },
  quote: { label: "Quote", icon: MessageSquareQuote },
};

function ProjectDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getProjectFn = useServerFn(getProject);
  const listDocsFn = useServerFn(listDocuments);
  const listInsightsFn = useServerFn(listInsights);
  const listOppsFn = useServerFn(listOpportunities);
  const listPRDsFn = useServerFn(listPRDs);

  const project = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectFn({ data: { id } }),
  });
  const docs = useQuery({
    queryKey: ["documents", id],
    queryFn: () => listDocsFn({ data: { projectId: id } }),
  });
  const insights = useQuery({
    queryKey: ["insights", id],
    queryFn: () => listInsightsFn({ data: { projectId: id } }),
  });
  const opps = useQuery({
    queryKey: ["opportunities", id],
    queryFn: () => listOppsFn({ data: { projectId: id } }),
  });
  const prds = useQuery({
    queryKey: ["prds", id],
    queryFn: () => listPRDsFn({ data: { projectId: id } }),
  });

  const [tab, setTab] = useState("research");

  if (project.isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!project.data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Project not found"
        description="This project doesn't exist or you don't have access to it."
        action={<Button asChild><Link to="/app/projects">Back to projects</Link></Button>}
      />
    );
  }

  const p = project.data;
  const docCount = docs.data?.length ?? 0;
  const processedDocs = (docs.data ?? []).filter((d) => d.status === "processed").length;
  const insightList = insights.data ?? [];
  const insightApproved = insightList.filter((i) => i.status === "approved").length;
  const insightPending = insightList.filter((i) => i.status === "pending").length;
  const oppCount = opps.data?.length ?? 0;
  const prdCount = prds.data?.length ?? 0;

  const steps = [
    { key: "research", label: "Research", detail: docCount === 0 ? "Upload notes" : `${processedDocs}/${docCount} processed`, done: processedDocs > 0, active: docCount === 0 },
    { key: "insights", label: "Insights", detail: insightList.length === 0 ? "None yet" : `${insightApproved} approved · ${insightPending} pending`, done: insightApproved > 0 && insightPending === 0 && insightList.length > 0, active: insightList.length > 0 && insightPending > 0 },
    { key: "opportunities", label: "Opportunities", detail: oppCount === 0 ? "Not generated" : `${oppCount} identified`, done: oppCount > 0, active: insightApproved > 0 && oppCount === 0 },
    { key: "prds", label: "PRDs", detail: prdCount === 0 ? "None drafted" : `${prdCount} drafted`, done: prdCount > 0, active: oppCount > 0 && prdCount === 0 },
  ];



  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app/projects" })}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> All projects
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Project</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{p.name}</h1>
          {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatChip label="Documents" value={docCount} icon={FileIcon} />
          <StatChip label="Insights approved" value={`${insightApproved}/${insightList.length}`} icon={Check} tone={insightApproved > 0 ? "success" : "default"} />
          <StatChip label="Opportunities" value={oppCount} icon={Lightbulb} />
          <StatChip label="PRDs" value={prdCount} icon={FileText} />
        </div>
      </div>

      <WorkflowStepper steps={steps} activeKey={tab} onStepClick={setTab} />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="prds">PRDs</TabsTrigger>
        </TabsList>

        <TabsContent value="research" className="mt-4">
          <ResearchTab projectId={id} />
        </TabsContent>
        <TabsContent value="insights" className="mt-4">
          <InsightsTab projectId={id} />
        </TabsContent>
        <TabsContent value="opportunities" className="mt-4">
          <OpportunitiesTab projectId={id} qc={qc} />
        </TabsContent>
        <TabsContent value="prds" className="mt-4">
          <PRDsTab projectId={id} qc={qc} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function StatChip({ label, value, icon: Icon, tone = "default" }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; tone?: "default" | "success" }) {
  const toneCls = tone === "success" ? "border-success/30 bg-success/5" : "border-border bg-card";
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${toneCls}`}>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="text-xs">
        <div className="text-muted-foreground">{label}</div>
        <div className="font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function WorkflowStepper({ steps, activeKey, onStepClick }: { steps: { key: string; label: string; detail: string; done: boolean; active: boolean }[]; activeKey: string; onStepClick: (k: string) => void }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-stretch gap-2 overflow-x-auto">
        {steps.map((s, idx) => {
          const isCurrent = s.key === activeKey;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStepClick(s.key)}
                className={`flex min-w-[140px] items-center gap-2.5 rounded-lg px-3 py-2 text-left transition ${
                  isCurrent
                    ? "bg-primary-soft ring-1 ring-primary/30"
                    : "hover:bg-muted/60"
                }`}
              >
                <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                  s.done ? "bg-success text-success-foreground" : s.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {s.done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">{s.label}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{s.detail}</div>
                </div>
              </button>
              {idx < steps.length - 1 && (
                <div className={`h-px w-4 ${steps[idx].done ? "bg-success/50" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



/* ---------------- Research Tab ---------------- */
function ResearchTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listDocuments);
  const createFn = useServerFn(createDocumentRecord);
  const deleteFn = useServerFn(deleteDocument);
  const processFn = useServerFn(processDocument);
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const docs = useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => listFn({ data: { projectId } }),
    refetchInterval: (q) =>
      (q.state.data ?? []).some((d) => d.status === "processing") ? 3000 : false,
  });

  const process = useMutation({
    mutationFn: (docId: string) => processFn({ data: { id: docId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", projectId] });
      qc.invalidateQueries({ queryKey: ["insights", projectId] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Document processed");
    },
    onError: (e: Error) => toast.error(`Processing failed: ${e.message}`),
  });

  const del = useMutation({
    mutationFn: (docId: string) => deleteFn({ data: { id: docId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", projectId] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");
      for (const file of list) {
        const ext = (file.name.split(".").pop() || "txt").toLowerCase();
        if (!["pdf", "docx", "txt"].includes(ext)) {
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }
        const path = `${userId}/${projectId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("research-files")
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (upErr) {
          toast.error(`Upload failed: ${upErr.message}`);
          continue;
        }
        const record = await createFn({
          data: {
            project_id: projectId,
            file_name: file.name,
            storage_path: path,
            mime_type: file.type || null,
            size_bytes: file.size,
          },
        });
        qc.invalidateQueries({ queryKey: ["documents", projectId] });
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
        toast.success(`Uploaded ${file.name}. Processing...`);
        process.mutate(record.id);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Card
        className={`mb-6 border-2 border-dashed transition ${dragOver ? "border-primary bg-primary-soft" : "border-border/70"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
      >
        <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-base font-semibold">Upload customer meeting notes</div>
          <div className="mt-1 max-w-md text-sm text-muted-foreground">
            PDF, DOCX, or TXT. Interviews, support notes, and product feedback all welcome.
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? "Uploading..." : "Choose files"}
            </Button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>
        </CardContent>
      </Card>

      {docs.isLoading ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
      ) : (docs.data?.length ?? 0) === 0 ? (
        <EmptyState icon={UploadCloud} title="No documents yet" description="Upload your first research document above." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {docs.data!.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{d.file_name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      <span>{formatSize(d.size_bytes)}</span>
                      <span>·</span>
                      <span>{new Date(d.created_at).toLocaleString()}</span>
                      {d.error_message && (
                        <>
                          <span>·</span>
                          <span className="text-destructive">{d.error_message}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <DocStatus status={d.status} />
                  {(d.status === "failed" || d.status === "processed") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => process.mutate(d.id)}
                      disabled={process.isPending}
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Reprocess
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => del.mutate(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function DocStatus({ status }: { status: string }) {
  const map: Record<string, { icon: React.ComponentType<{ className?: string }>; cls: string; spin?: boolean; label: string }> = {
    processed: { icon: CheckCircle2, cls: "bg-success/15 text-success border-success/20", label: "Processed" },
    processing: { icon: Loader2, cls: "bg-info/15 text-info border-info/20", spin: true, label: "Processing" },
    uploaded: { icon: Clock, cls: "bg-muted text-muted-foreground", label: "Queued" },
    failed: { icon: AlertCircle, cls: "bg-destructive/15 text-destructive border-destructive/20", label: "Failed" },
  };
  const s = map[status] ?? map.uploaded;
  const Icon = s.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${s.cls}`}>
      <Icon className={`h-3 w-3 ${s.spin ? "animate-spin" : ""}`} />
      {s.label}
    </Badge>
  );
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ---------------- Insights Tab ---------------- */
function InsightsTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listInsights);
  const updateFn = useServerFn(updateInsight);
  const deleteFn = useServerFn(deleteInsight);
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const insights = useQuery({
    queryKey: ["insights", projectId],
    queryFn: () => listFn({ data: { projectId } }),
  });

  const update = useMutation({
    mutationFn: (v: any) => updateFn({ data: v }),
    onSuccess: (_r, vars: any) => {
      qc.invalidateQueries({ queryKey: ["insights", projectId] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      if (vars?.status === "approved") toast.success("Insight approved");
      else if (vars?.status === "rejected") toast.success("Insight rejected");
      else if (vars?.user_edited) toast.success("Insight updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (insightId: string) => deleteFn({ data: { id: insightId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insights", projectId] }),
  });

  const rows = (insights.data ?? []).filter((i) => {
    if (filter !== "all" && i.kind !== filter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  });

  const kinds = ["all", "pain_point", "user_goal", "feature_request", "quote"];
  const statuses = ["all", "pending", "approved", "rejected"];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Type:</span>
          <div className="flex gap-1 rounded-lg border p-1">
            {kinds.map((k) => (
              <Button
                key={k}
                size="sm"
                variant={filter === k ? "secondary" : "ghost"}
                className="h-7 text-xs"
                onClick={() => setFilter(k)}
              >
                {k === "all" ? "All" : INSIGHT_KIND_META[k]?.label ?? k}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <div className="flex gap-1 rounded-lg border p-1">
            {statuses.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "secondary" : "ghost"}
                className="h-7 text-xs capitalize"
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </div>


      {insights.isLoading ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No insights yet"
          description="Upload research and process it to generate AI insights for your review."
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((i) => (
            <InsightCard
              key={i.id}
              insight={i}
              onUpdate={(data) => update.mutate({ id: i.id, ...data })}
              onDelete={() => del.mutate(i.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

type InsightRow = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  quote_text: string | null;
  speaker: string | null;
  sentiment: string | null;
  confidence: number | null;
  status: string;
  research_documents?: { file_name: string } | { file_name: string }[] | null;
};

function InsightCard({
  insight,
  onUpdate,
  onDelete,
}: {
  insight: InsightRow;
  onUpdate: (data: { status?: "pending" | "approved" | "rejected"; title?: string; description?: string | null; quote_text?: string | null; user_edited?: boolean }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(insight.title);
  const [description, setDescription] = useState(insight.description ?? "");
  const [quote, setQuote] = useState(insight.quote_text ?? "");
  const meta = INSIGHT_KIND_META[insight.kind] ?? { label: insight.kind, icon: Lightbulb };
  const Icon = meta.icon;
  const docName = Array.isArray(insight.research_documents)
    ? insight.research_documents[0]?.file_name
    : insight.research_documents?.file_name;

  const statusColor =
    insight.status === "approved"
      ? "bg-success/20 text-success border-success/30 font-semibold"
      : insight.status === "rejected"
        ? "bg-destructive/15 text-destructive border-destructive/20 font-semibold"
        : "bg-muted text-muted-foreground";

  return (
    <Card className={
      insight.status === "approved"
        ? "border-success/40 bg-success/5"
        : insight.status === "rejected"
          ? "border-destructive/30 bg-destructive/5 opacity-70"
          : ""
    }>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{meta.label}</Badge>
              <Badge variant="outline" className={statusColor}>
                {insight.status === "approved" && <Check className="mr-0.5 h-3 w-3" />}
                {insight.status}
              </Badge>
            </div>
            {editing ? (
              <div className="mt-3 space-y-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                {insight.kind === "quote" ? (
                  <Textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={3} placeholder="Quote text" />
                ) : (
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Description" />
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => {
                    onUpdate({ title, description, quote_text: quote, user_edited: true });
                    setEditing(false);
                  }}>
                    <Save className="mr-1.5 h-3.5 w-3.5" />Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setTitle(insight.title);
                    setDescription(insight.description ?? "");
                    setQuote(insight.quote_text ?? "");
                    setEditing(false);
                  }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-2 text-sm font-semibold">{insight.title}</div>
                {insight.kind === "quote" && insight.quote_text ? (
                  <blockquote className="mt-1 border-l-2 border-primary/50 pl-3 text-sm italic text-muted-foreground">
                    "{insight.quote_text}"
                    {insight.speaker && <div className="mt-1 text-xs not-italic">— {insight.speaker}{insight.sentiment && ` · ${insight.sentiment}`}</div>}
                  </blockquote>
                ) : (
                  insight.description && <div className="mt-1 text-sm text-muted-foreground">{insight.description}</div>
                )}
                {insight.status === "pending" && typeof insight.confidence === "number" && (
                  <div className="mt-3">
                    <ConfidenceBar value={insight.confidence} />
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <AIBadge />
                  {docName && <span className="truncate">from {docName}</span>}
                </div>
              </>
            )}
          </div>
          {!editing && (
            <div className="flex flex-wrap items-center gap-1">
              {insight.status === "approved" ? (
                <>
                  <Button size="sm" variant="success" disabled className="opacity-100">
                    <Check className="mr-1 h-3.5 w-3.5" />Approved
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onUpdate({ status: "pending" })}>
                    Undo
                  </Button>
                </>
              ) : insight.status === "rejected" ? (
                <>
                  <Button size="sm" variant="destructive" disabled className="opacity-100">
                    <X className="mr-1 h-3.5 w-3.5" />Rejected
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onUpdate({ status: "pending" })}>
                    Undo
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => onUpdate({ status: "approved" })}>
                    <Check className="mr-1 h-3.5 w-3.5" />Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onUpdate({ status: "rejected" })}>
                    <X className="mr-1 h-3.5 w-3.5" />Reject
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Opportunities Tab ---------------- */
function OpportunitiesTab({ projectId, qc }: { projectId: string; qc: ReturnType<typeof useQueryClient> }) {
  const listFn = useServerFn(listOpportunities);
  const genFn = useServerFn(generateOpportunities);
  const updateFn = useServerFn(updateOpportunity);
  const deleteFn = useServerFn(deleteOpportunity);
  const genPRDFn = useServerFn(generatePRDFromOpportunity);

  const opps = useQuery({
    queryKey: ["opportunities", projectId],
    queryFn: () => listFn({ data: { projectId } }),
  });

  const generate = useMutation({
    mutationFn: () => genFn({ data: { projectId } }),
    onSuccess: (r) => {
      toast.success(`Generated ${r.count} opportunities`);
      qc.invalidateQueries({ queryKey: ["opportunities", projectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (v: any) => updateFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunities", projectId] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (oid: string) => deleteFn({ data: { id: oid } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunities", projectId] }),
  });
  const draftPRD = useMutation({
    mutationFn: (oid: string) => genPRDFn({ data: { opportunityId: oid } }),
    onSuccess: () => {
      toast.success("PRD drafted");
      qc.invalidateQueries({ queryKey: ["prds", projectId] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
          {generate.isPending ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Generating...</> : <><Wand2 className="mr-1.5 h-4 w-4" />Generate opportunities</>}
        </Button>
      </div>

      {opps.isLoading ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
      ) : (opps.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No opportunities yet"
          description="Approve at least 2 insights, then generate product opportunities with AI."
        />
      ) : (
        <div className="grid gap-3">
          {[...opps.data!]
            .map((o) => ({ o, rice: riceScore(o) }))
            .sort((a, b) => (b.rice ?? -1) - (a.rice ?? -1))
            .map(({ o, rice }) => (
            <Card key={o.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <AIBadge />
                      <Badge variant="outline">{o.status}</Badge>
                      <MoscowSelect value={(o as { moscow?: string | null }).moscow ?? null} onChange={(v) => update.mutate({ id: o.id, moscow: v })} />
                      {rice !== null && (
                        <Badge variant="secondary" className="ml-auto font-mono">RICE {rice.toFixed(1)}</Badge>
                      )}
                    </div>
                    <Input
                      className="border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
                      defaultValue={o.title}
                      onBlur={(e) => e.target.value !== o.title && update.mutate({ id: o.id, title: e.target.value })}
                    />
                    <div className="mt-2 grid gap-2 text-sm">
                      <LabeledEdit label="Problem" value={o.problem ?? ""} onSave={(v) => update.mutate({ id: o.id, problem: v })} />
                      <LabeledEdit label="Target user" value={o.target_user ?? ""} onSave={(v) => update.mutate({ id: o.id, target_user: v })} />
                      <LabeledEdit label="Value proposition" value={o.value_prop ?? ""} onSave={(v) => update.mutate({ id: o.id, value_prop: v })} />
                    </div>
                    <RiceEditor opp={o as RiceFields & { id: string }} onSave={(patch) => update.mutate({ id: o.id, ...patch })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" onClick={() => draftPRD.mutate(o.id)} disabled={draftPRD.isPending}>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />Draft PRD
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(o.id)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

type RiceFields = { reach?: number | null; impact?: number | null; confidence?: number | null; effort?: number | null };

function riceScore(o: RiceFields): number | null {
  const r = Number(o.reach), i = Number(o.impact), c = Number(o.confidence), e = Number(o.effort);
  if (!r || !i || !c || !e) return null;
  return (r * i * (c / 100)) / e;
}

const MOSCOW_OPTIONS = [
  { value: "must", label: "Must", cls: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950 dark:text-red-200" },
  { value: "should", label: "Should", cls: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200" },
  { value: "could", label: "Could", cls: "bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-950 dark:text-sky-200" },
  { value: "wont", label: "Won't", cls: "bg-muted text-muted-foreground hover:bg-muted/80" },
];

function MoscowSelect({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const current = MOSCOW_OPTIONS.find((o) => o.value === value);
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={`h-6 rounded-md border border-input px-1.5 text-xs font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring ${current?.cls ?? "bg-background"}`}
      title="MoSCoW priority"
    >
      <option value="">MoSCoW…</option>
      {MOSCOW_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function RiceEditor({ opp, onSave }: { opp: RiceFields; onSave: (patch: RiceFields) => void }) {
  const fields: { key: keyof RiceFields; label: string; hint: string; min: number; max: number; step: number }[] = [
    { key: "reach", label: "Reach", hint: "users / quarter", min: 0, max: 100000, step: 10 },
    { key: "impact", label: "Impact", hint: "0.25 – 3", min: 0, max: 3, step: 0.25 },
    { key: "confidence", label: "Confidence", hint: "%", min: 0, max: 100, step: 5 },
    { key: "effort", label: "Effort", hint: "person-months", min: 0, max: 24, step: 0.5 },
  ];
  return (
    <div className="mt-3 rounded-lg border border-dashed bg-muted/30 p-2.5">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">RICE scoring</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">{f.label} <span className="opacity-60">({f.hint})</span></span>
            <Input
              type="number"
              min={f.min}
              max={f.max}
              step={f.step}
              defaultValue={opp[f.key] ?? ""}
              onBlur={(e) => {
                const raw = e.target.value;
                const next = raw === "" ? null : Number(raw);
                if (next !== (opp[f.key] ?? null)) onSave({ [f.key]: next });
              }}
              className="h-8 text-sm"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function LabeledEdit({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <Textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== value && onSave(v)}
        rows={2}
        className="mt-0.5 resize-none border-transparent bg-transparent px-2 shadow-none hover:border-border focus-visible:border-input"
      />
    </div>
  );
}

/* ---------------- PRDs Tab ---------------- */
type PRDSectionsShape = {
  problem_statement?: string;
  background?: string;
  goals?: string[];
  non_goals?: string[];
  target_users?: string;
  user_stories?: string[];
  functional_requirements?: string[];
  acceptance_criteria?: string[];
  success_metrics?: string[];
  risks?: string;
  [key: string]: unknown;
};

function downloadPRDAsPDF(title: string, sections: PRDSectionsShape) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 54;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const writeLines = (text: string, size: number, style: "normal" | "bold" = "normal", gap = 4) => {
    if (!text) return;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    const lineHeight = size * 1.35;
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += gap;
  };
  const heading = (t: string) => {
    ensureSpace(28);
    y += 6;
    writeLines(t, 14, "bold", 2);
  };
  const paragraph = (t?: string) => t && writeLines(t, 11, "normal", 8);
  const bullets = (items?: string[]) => {
    if (!items?.length) return;
    for (const item of items) writeLines(`•  ${item}`, 11, "normal", 2);
    y += 6;
  };

  writeLines(title, 20, "bold", 6);
  writeLines(`Generated ${new Date().toLocaleDateString()}`, 10, "normal", 12);

  heading("Problem statement"); paragraph(sections.problem_statement);
  heading("Background"); paragraph(sections.background);
  heading("Target users"); paragraph(sections.target_users);
  heading("Goals"); bullets(sections.goals);
  heading("Non-goals"); bullets(sections.non_goals);
  heading("User stories"); bullets(sections.user_stories);
  heading("Functional requirements"); bullets(sections.functional_requirements);
  heading("Acceptance criteria"); bullets(sections.acceptance_criteria);
  heading("Success metrics"); bullets(sections.success_metrics);
  heading("Risks"); paragraph(sections.risks);

  const safe = title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "PRD";
  doc.save(`${safe}.pdf`);
}



function PRDsTab({ projectId, qc }: { projectId: string; qc: ReturnType<typeof useQueryClient> }) {
  const listFn = useServerFn(listPRDs);
  const updateFn = useServerFn(updatePRD);
  const deleteFn = useServerFn(deletePRD);
  const regenFn = useServerFn(regeneratePRDSection);

  const prds = useQuery({
    queryKey: ["prds", projectId],
    queryFn: () => listFn({ data: { projectId } }),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = (prds.data ?? []).find((p) => p.id === selectedId) ?? prds.data?.[0];

  const update = useMutation({
    mutationFn: (v: any) => updateFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prds", projectId] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (pid: string) => deleteFn({ data: { id: pid } }),
    onSuccess: () => {
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["prds", projectId] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
  const regen = useMutation({
    mutationFn: (v: { prdId: string; section: string }) => regenFn({ data: v }),
    onSuccess: () => {
      toast.success("Section regenerated");
      qc.invalidateQueries({ queryKey: ["prds", projectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (prds.isLoading) {
    return <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>;
  }
  if ((prds.data?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No PRDs yet"
        description="Draft a PRD from an approved opportunity to get started."
      />
    );
  }

  const sections = ((selected?.sections ?? {}) as PRDSectionsShape);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <CardContent className="space-y-1 p-3">
          {prds.data!.map((pr) => (
            <button
              key={pr.id}
              onClick={() => setSelectedId(pr.id)}
              className={`w-full rounded-lg border p-3 text-left transition ${(selected?.id === pr.id) ? "border-primary bg-primary-soft" : "border-transparent hover:bg-muted/50"}`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1 truncate text-sm font-medium">{pr.title}</div>
              </div>
              <Badge variant="outline" className="mt-2 text-[10px]">{pr.status}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Input
                  defaultValue={selected.title}
                  onBlur={(e) => e.target.value !== selected.title && update.mutate({ id: selected.id, title: e.target.value })}
                  className="border-0 bg-transparent px-0 text-2xl font-bold shadow-none focus-visible:ring-0"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <AIBadge />
                  <Badge variant="outline">{selected.status}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadPRDAsPDF(selected.title, sections)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />Download PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => update.mutate({ id: selected.id, status: selected.status === "approved" ? "draft" : "approved" })}>
                  {selected.status === "approved" ? "Unapprove" : "Mark approved"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => confirm("Delete this PRD?") && del.mutate(selected.id)}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
                </Button>
              </div>
            </div>

            <Section title="Problem statement" section="problem_statement" prd={selected} value={sections.problem_statement ?? ""} onSave={(v) => update.mutate({ id: selected.id, sections: { ...sections, problem_statement: v } })} onRegen={() => regen.mutate({ prdId: selected.id, section: "problem_statement" })} />
            <Section title="Background" section="background" prd={selected} value={sections.background ?? ""} onSave={(v) => update.mutate({ id: selected.id, sections: { ...sections, background: v } })} onRegen={() => regen.mutate({ prdId: selected.id, section: "background" })} />
            <Section title="Target users" section="target_users" prd={selected} value={sections.target_users ?? ""} onSave={(v) => update.mutate({ id: selected.id, sections: { ...sections, target_users: v } })} onRegen={() => regen.mutate({ prdId: selected.id, section: "target_users" })} />
            <ListSection title="Goals" section="goals" items={sections.goals ?? []} onSave={(items) => update.mutate({ id: selected.id, sections: { ...sections, goals: items } })} onRegen={() => regen.mutate({ prdId: selected.id, section: "goals" })} />
            <ListSection title="Non-goals" section="non_goals" items={sections.non_goals ?? []} onSave={(items) => update.mutate({ id: selected.id, sections: { ...sections, non_goals: items } })} onRegen={() => regen.mutate({ prdId: selected.id, section: "non_goals" })} />
            <ListSection title="User stories" section="user_stories" items={sections.user_stories ?? []} onSave={(items) => update.mutate({ id: selected.id, sections: { ...sections, user_stories: items } })} onRegen={() => regen.mutate({ prdId: selected.id, section: "user_stories" })} />
            <ListSection title="Functional requirements" section="functional_requirements" items={sections.functional_requirements ?? []} onSave={(items) => update.mutate({ id: selected.id, sections: { ...sections, functional_requirements: items } })} onRegen={() => regen.mutate({ prdId: selected.id, section: "functional_requirements" })} />
            <ListSection title="Acceptance criteria" section="acceptance_criteria" items={sections.acceptance_criteria ?? []} onSave={(items) => update.mutate({ id: selected.id, sections: { ...sections, acceptance_criteria: items } })} onRegen={() => regen.mutate({ prdId: selected.id, section: "acceptance_criteria" })} />
            <ListSection title="Success metrics" section="success_metrics" items={sections.success_metrics ?? []} onSave={(items) => update.mutate({ id: selected.id, sections: { ...sections, success_metrics: items } })} onRegen={() => regen.mutate({ prdId: selected.id, section: "success_metrics" })} />
            <Section title="Risks" section="risks" prd={selected} value={sections.risks ?? ""} onSave={(v) => update.mutate({ id: selected.id, sections: { ...sections, risks: v } })} onRegen={() => regen.mutate({ prdId: selected.id, section: "risks" })} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Section({ title, section, value, onSave, onRegen }: { title: string; section: string; prd: unknown; value: string; onSave: (v: string) => void; onRegen: () => void }) {
  void section;
  const [v, setV] = useState(value);
  // reset on prop change
  const [prev, setPrev] = useState(value);
  if (prev !== value) { setPrev(value); setV(value); }
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onRegen}>
          <RefreshCw className="h-3 w-3" />Regenerate
        </Button>
      </div>
      <Textarea value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onSave(v)} rows={3} className="resize-y" />
    </div>
  );
}

function ListSection({ title, section, items, onSave, onRegen }: { title: string; section: string; items: string[]; onSave: (i: string[]) => void; onRegen: () => void }) {
  void section;
  const [rows, setRows] = useState(items);
  const [prev, setPrev] = useState(items);
  if (prev !== items) { setPrev(items); setRows(items); }
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onRegen}>
          <RefreshCw className="h-3 w-3" />Regenerate
        </Button>
      </div>
      <div className="space-y-2">
        {rows.map((it, idx) => (
          <div key={idx} className="flex gap-2">
            <div className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <Textarea
              value={it}
              onChange={(e) => setRows(rows.map((v, i) => (i === idx ? e.target.value : v)))}
              onBlur={() => JSON.stringify(rows) !== JSON.stringify(items) && onSave(rows)}
              rows={1}
              className="min-h-9 flex-1 resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
