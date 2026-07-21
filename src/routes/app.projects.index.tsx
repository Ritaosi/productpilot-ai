import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { FolderKanban, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { listProjects, createProject, deleteProject } from "@/lib/projects.functions";

export const Route = createFileRoute("/app/projects/")({
  component: ProjectsPage,
  head: () => ({ meta: [{ title: "Projects — ProductPilot AI" }] }),
});

function ProjectsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listProjects);
  const createFn = useServerFn(createProject);
  const deleteFn = useServerFn(deleteProject);
  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => listFn() });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", target_users: "" });

  const create = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: () => {
      toast.success("Project created");
      setOpen(false);
      setForm({ name: "", description: "", target_users: "" });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Project deleted");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Each project has its own research library, insights, opportunities, and PRDs."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1.5 h-4 w-4" />New project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>Set up a new product discovery workspace.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Billing revamp" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What is this project about?" />
                </div>
                <div className="space-y-1.5">
                  <Label>Target users</Label>
                  <Input value={form.target_users} onChange={(e) => setForm({ ...form, target_users: e.target.value })} placeholder="e.g. SMB finance operators" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
                  {create.isPending ? "Creating..." : "Create project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start uploading customer research and generating insights."
          action={<Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Create project</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((p) => (
            <Card key={p.id} className="group relative transition hover:border-primary/50">
              <CardContent className="p-4">
                <Link to="/app/projects/$id" params={{ id: p.id }} className="block">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</div>
                  </div>
                  {p.description && <div className="line-clamp-2 text-xs text-muted-foreground">{p.description}</div>}
                  {p.target_users && (
                    <div className="mt-2 text-[11px] text-muted-foreground">Target: {p.target_users}</div>
                  )}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm(`Delete "${p.name}" and all its data?`)) del.mutate(p.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
