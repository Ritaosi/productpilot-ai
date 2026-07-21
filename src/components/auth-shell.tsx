import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-0 bg-hero-glow" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <span className="text-base font-bold tracking-tight">ProductPilot AI</span>
        </Link>
        <Card className="border-border/70 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
