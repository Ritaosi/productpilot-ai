import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </div>
        )}
        <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}

export function AIBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 border-primary/20 bg-primary-soft text-primary hover:bg-primary-soft",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      AI generated
    </Badge>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-[10px] uppercase tracking-wider text-muted-foreground", className)}
    >
      Demo data
    </Badge>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.85 ? "bg-success" : value >= 0.7 ? "bg-info" : "bg-warning";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-sm font-semibold">{title}</div>
      {description && (
        <div className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
