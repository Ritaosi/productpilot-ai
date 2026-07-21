import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui-bits";
import { Slack, Cloud, Ticket, Kanban, PhoneCall, Webhook, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/integrations")({
  component: IntegrationsPage,
  head: () => ({ meta: [{ title: "Integrations — ProductPilot AI" }] }),
});

type Status = "connected" | "available" | "beta";

const integrations: {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: Status;
  agent: string;
}[] = [
  {
    name: "Salesforce",
    description: "Pull opportunity notes, call recordings, and account signals into the Ingestion Agent.",
    icon: Cloud,
    status: "available",
    agent: "Ingestion Agent",
  },
  {
    name: "Slack",
    description: "Post agent updates, PRD drafts, and approval requests to product channels.",
    icon: Slack,
    status: "available",
    agent: "Reviewer Agent",
  },
  {
    name: "Zendesk",
    description: "Stream support tickets so the Insight Agent can cluster recurring pain points.",
    icon: Ticket,
    status: "available",
    agent: "Insight Agent",
  },
  {
    name: "Jira",
    description: "Sync approved opportunities and PRDs into your delivery backlog automatically.",
    icon: Kanban,
    status: "available",
    agent: "Delivery Agent",
  },
  {
    name: "Linear",
    description: "Create and update issues from approved PRDs — bi-directional status sync.",
    icon: Kanban,
    status: "available",
    agent: "Delivery Agent",
  },
  {
    name: "Gong",
    description: "Ingest sales and CS call transcripts as first-class research documents.",
    icon: PhoneCall,
    status: "beta",
    agent: "Ingestion Agent",
  },
  {
    name: "Webhooks & Public API",
    description: "Trigger agents from any tool — CRM, feedback portal, or custom pipeline.",
    icon: Webhook,
    status: "available",
    agent: "Any agent",
  },
];

function statusBadge(s: Status) {
  if (s === "connected") return <Badge className="bg-success text-success-foreground">Connected</Badge>;
  if (s === "beta") return <Badge variant="outline" className="border-warning/40 text-warning">Beta</Badge>;
  return <Badge variant="secondary">Available</Badge>;
}

function IntegrationsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Integrations"
        title="Connect your customer signal stack"
        description="Autonomous agents work best when they can reach the systems where customer truth lives. Wire up the tools your team already uses — agents ingest, cluster, and route the results back automatically."
      />

      <div className="mb-6 rounded-xl border bg-primary-soft/40 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <div className="font-semibold text-foreground">How agents use integrations</div>
            <p className="mt-1 text-muted-foreground">
              Each integration feeds a specific agent. The Ingestion Agent pulls raw signal, the Insight Agent
              extracts and clusters, the Reviewer Agent asks for your approval, and the Delivery Agent pushes
              approved artifacts into your execution tools — all without you moving data by hand.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => (
          <Card key={i.name} className="flex flex-col">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted">
                  <i.icon className="h-5 w-5 text-foreground" />
                </div>
                {statusBadge(i.status)}
              </div>
              <CardTitle className="text-base">{i.name}</CardTitle>
              <CardDescription>{i.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Feeds · {i.agent}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info(`${i.name} connector coming soon`, { description: "Request early access from your workspace admin." })}
              >
                Connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
