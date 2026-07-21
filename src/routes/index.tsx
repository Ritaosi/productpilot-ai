import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  Bot,
  Sparkles,
  FileSearch,
  Lightbulb,
  ListChecks,
  FileText,
  Map,
  Workflow,
  ShieldCheck,
  MessageSquareQuote,
  CheckCircle2,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  { icon: FileSearch, title: "Unify every source of research", body: "Drop in interviews, tickets, surveys, reviews, and feature requests. ProductPilot normalizes and indexes them into one searchable evidence base." },
  { icon: Lightbulb, title: "Synthesize insights in minutes", body: "AI extracts pain points, goals, feature requests, and sentiment — with citations back to the original source, ready for you to approve or reject." },
  { icon: ListChecks, title: "Prioritize with RICE, MoSCoW, and Impact/Effort", body: "Turn approved insights into scored product opportunities. Every score is an AI suggestion you can override." },
  { icon: FileText, title: "Generate PRDs with evidence", body: "Draft complete PRDs — problem, users, stories, requirements, metrics — grounded in the customer quotes that inspired them." },
  { icon: Map, title: "Build a Now / Next / Later roadmap", body: "Slot approved PRDs into a visual roadmap with customer value, effort, and success metrics attached to each card." },
  { icon: Workflow, title: "Autonomous agents, human checkpoints", body: "Specialized agents draft, review, and refine work autonomously — you approve at every stage transition. Nothing ships without your sign-off." },
];

const steps = [
  { n: "01", title: "Upload research", body: "Interviews, tickets, surveys, reviews — any format." },
  { n: "02", title: "Review AI insights", body: "Approve, edit, or regenerate what the Insight Agent produces." },
  { n: "03", title: "Prioritize opportunities", body: "Score with RICE or MoSCoW. Override AI suggestions any time." },
  { n: "04", title: "Ship with a PRD + roadmap", body: "Draft PRDs and slot them into Now / Next / Later." },
];

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app", replace: true });
    });
  }, [navigate]);
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight">ProductPilot AI</span>
          </Link>
          <nav className="ml-6 hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Start free <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow" aria-hidden />
        <div className="absolute inset-0 bg-grid opacity-[0.15]" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-5 gap-1.5 border-primary/20 bg-primary-soft text-primary">
              <Sparkles className="h-3 w-3" />
              Autonomous AI agents for product teams
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight md:text-6xl">
              Autonomous agents that draft, review, and refine <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">product artifacts</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
              A team of specialized agents ingests research from Salesforce, Slack, Zendesk and uploads — then autonomously drafts insights, opportunities, PRDs, and competitive briefs. You review and approve at every checkpoint.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/signup">Start free trial <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/app">See live demo</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" />No credit card required</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" />SOC 2-ready architecture</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" />Human review at every step</span>
            </div>
          </div>

          {/* Hero product mock */}
          <div className="relative mx-auto mt-14 max-w-5xl">
            <div className="rounded-2xl border bg-card p-2 shadow-2xl">
              <div className="flex items-center gap-1.5 px-2 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning" />
                <div className="h-2.5 w-2.5 rounded-full bg-success" />
                <div className="ml-3 text-xs text-muted-foreground">Product preview — illustrative sample data</div>
              </div>
              <div className="grid grid-cols-12 gap-3 rounded-xl bg-background p-3">
                <div className="col-span-3 hidden rounded-lg border bg-sidebar p-3 md:block">
                  {["Dashboard", "Projects", "Research", "Insights", "Prioritization", "PRDs", "Roadmap"].map((i, idx) => (
                    <div key={i} className={`mb-1 rounded px-2 py-1.5 text-xs ${idx === 3 ? "bg-primary-soft font-semibold text-primary" : "text-muted-foreground"}`}>{i}</div>
                  ))}
                </div>
                <div className="col-span-12 space-y-3 md:col-span-9">
                  <div className="grid grid-cols-3 gap-3">
                    {[["Insights", "412"], ["Opportunities", "38"], ["PRDs", "9"]].map(([l, v]) => (
                      <div key={l} className="rounded-lg border bg-card p-3">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
                        <div className="text-xl font-bold">{v}</div>
                      </div>
                    ))}
                  </div>
                  {[
                    { c: "Pain point", t: "Failed cards freeze seat management", s: "22 tickets · 9 interviews" },
                    { c: "Feature request", t: "Bulk invoice export with GL codes", s: "Canny · 41 upvotes" },
                    { c: "Recurring problem", t: "Search stale after workspace rename", s: "22 tickets" },
                  ].map((r) => (
                    <div key={r.t} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                      <Badge variant="secondary" className="border-primary/20 bg-primary-soft text-primary">
                        <Sparkles className="mr-1 h-3 w-3" />{r.c}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.t}</div>
                        <div className="truncate text-xs text-muted-foreground">{r.s}</div>
                      </div>
                      <div className="hidden gap-1 sm:flex">
                        <div className="rounded-md border px-2 py-1 text-[10px]">Approve</div>
                        <div className="rounded-md border px-2 py-1 text-[10px]">Edit</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Quote className="mx-auto mb-4 h-6 w-6 text-primary" />
          <p className="text-balance text-2xl font-semibold leading-relaxed md:text-3xl">
            "I have 40 interviews, 2,000 tickets, and a roadmap review on Friday. There's no way I've read all of this."
          </p>
          <p className="mt-3 text-sm text-muted-foreground">— Every product manager, every quarter</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Research pileup", "Interviews, tickets, surveys, and reviews stack up in four different tools."],
              ["Slow synthesis", "Weeks pass between a customer call and a shippable spec."],
              ["Weak evidence", "Prioritization arguments happen without the quotes that would settle them."],
            ].map(([t, b]) => (
              <div key={t} className="rounded-xl border bg-card p-5 text-left">
                <div className="mb-2 text-sm font-semibold">{t}</div>
                <div className="text-sm text-muted-foreground">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Core features</div>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Everything a PM needs, backed by evidence
          </h2>
          <p className="mt-3 text-muted-foreground">
            From raw research to a prioritized roadmap — with citations and human approval at every step.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="group border-border/70 transition hover:border-primary/40 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="text-base font-semibold">{f.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-y bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">How it works</div>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              From messy research to shipped features
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-xl border bg-card p-5">
                <div className="text-xs font-mono text-primary">{s.n}</div>
                <div className="mt-2 text-base font-semibold">{s.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Autonomous multi-agent system</div>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Agents that draft, review, and refine — you approve.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Seven specialized agents run the loop autonomously: one drafts, another critiques, a third refines. Every stage transition is a human checkpoint — approve, edit, or regenerate before anything moves forward.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Drafter → Reviewer → Refiner loop on every artifact",
                "Ingests from Salesforce, Slack, Zendesk, and file uploads",
                "Every output cites the source it came from",
                "Nothing hits your roadmap without your approval",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-lg">
            {[
              { n: "Ingestion", d: "Pulls from Salesforce, Slack, Zendesk, uploads" },
              { n: "Insight", d: "Autonomously clusters pain points + goals" },
              { n: "Reviewer", d: "Critiques drafts, flags weak evidence" },
              { n: "Prioritization", d: "RICE / MoSCoW scoring agent" },
              { n: "Competitive Intel", d: "Scans market + competitor signals" },
              { n: "PRD Drafter", d: "Writes full PRD sections with citations" },
              { n: "Refiner", d: "Iterates until reviewer + human approve" },
            ].map((a, i, arr) => (
              <div key={a.n}>
                <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft font-mono text-xs font-bold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{a.n} Agent</div>
                    <div className="truncate text-xs text-muted-foreground">{a.d}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Human review</Badge>
                </div>
                {i < arr.length - 1 && <div className="ml-7 h-3 w-px bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Integrations</div>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Meet your research where it already lives.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Agents pull signal from the tools your team already uses — no manual export required.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { name: "Salesforce", status: "Live", body: "Sync support cases, opportunity notes, and CSM call summaries as research sources." },
              { name: "Slack", status: "Live", body: "Route #customer-feedback and #wins channels into the evidence base with one click." },
              { name: "Zendesk & Intercom", status: "Beta", body: "Stream tickets and conversations directly into the Insight Agent." },
              { name: "Jira & Linear", status: "Beta", body: "Push approved PRDs and prioritized opportunities into your engineering backlog." },
              { name: "Gong & Chorus", status: "Roadmap", body: "Auto-ingest sales and discovery call transcripts with speaker attribution." },
              { name: "Public API & Webhooks", status: "Live", body: "Build custom pipelines against any AI artifact — insights, PRDs, roadmap items." },
            ].map((i) => (
              <div key={i.name} className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{i.name}</div>
                  <Badge variant={i.status === "Live" ? "default" : "outline"} className="text-[10px]">{i.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{i.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive intelligence */}
      <section id="competitive" className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold">Competitive brief · Acme vs. market</div>
              <Badge variant="outline" className="text-[10px]">Draft · needs review</Badge>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: "Positioning gap", body: "Competitors lead on enterprise SSO; our differentiation is time-to-insight." },
                { label: "Feature parity", body: "3 of 5 competitors ship AI summarization; only 1 offers cited outputs." },
                { label: "Pricing signal", body: "Median seat price $45/mo — our $29 tier is well-positioned for mid-market." },
                { label: "Recommended move", body: "Lead PRD with 'cited AI' as core wedge; deprioritize SSO parity for Q3." },
              ].map((r) => (
                <div key={r.label} className="rounded-lg border bg-background p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary">{r.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{r.body}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Competitive intelligence</div>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Ship product decisions with market context, not just customer voice.
            </h2>
            <p className="mt-4 text-muted-foreground">
              The Competitive Intel Agent continuously scans competitor sites, changelogs, review platforms, and pricing pages — then drafts briefs that plug directly into your PRDs and prioritization.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Track feature parity across up to 10 competitors",
                "Weekly change digests from changelogs, blogs, and G2 reviews",
                "Auto-attach competitive context to every PRD draft",
                "Human approval before any competitive claim ships internally",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-xs text-muted-foreground">Beta — request access from Settings.</div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-y bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border bg-card p-8 shadow-sm md:p-12">
            <MessageSquareQuote className="mb-4 h-6 w-6 text-primary" />
            <blockquote className="text-balance text-xl font-medium leading-relaxed md:text-2xl">
              "ProductPilot cut our research synthesis from three days to an afternoon — and the PRDs come out with real customer quotes attached. That's the part my engineers actually trust."
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">MR</div>
              <div>
                <div className="text-sm font-semibold">Maya Rodriguez</div>
                <div className="text-xs text-muted-foreground">Head of Product, mid-market SaaS · Demo persona</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
          Ready to build with evidence?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Start a free workspace, upload a few interviews, and watch ProductPilot turn them into insights, opportunities, and a draft PRD.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/signup">Start free <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/app">Explore the demo</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-info text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold">ProductPilot AI</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Autonomous AI agents that draft, review, and refine product artifacts — grounded in your customer research and market context.
            </p>
          </div>
          {[
            { h: "Product", l: ["Features", "Workflow", "Roadmap", "Changelog"] },
            { h: "Company", l: ["About", "Careers", "Customers", "Contact"] },
            { h: "Resources", l: ["Docs", "PM Playbook", "Security", "Status"] },
          ].map((c) => (
            <div key={c.h}>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider">{c.h}</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {c.l.map((i) => (
                  <li key={i}><a href="#" className="hover:text-foreground">{i}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row">
            <div>© {new Date().getFullYear()} ProductPilot AI · Portfolio demo</div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
              <a href="#" className="hover:text-foreground">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
