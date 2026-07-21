import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui-bits";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — ProductPilot AI" }] }),
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      const meta = data.user?.user_metadata as { full_name?: string } | undefined;
      setName(meta?.full_name ?? "");
      loadProfile(data.user?.id);
    });
  }, []);

  async function loadProfile(userId: string | undefined) {
    if (!userId) return;
    const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    if (data?.full_name) setName(data.full_name);
  }

  async function handleSaveProfile() {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userData.user.id, full_name: name });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage your profile and appearance."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>How you appear in your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Choose your preferred theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 rounded-xl border-2 p-4 text-left transition ${theme === t ? "border-primary" : "border-border hover:border-primary/50"}`}
                >
                  <div className={`mb-3 h-20 rounded-lg border ${t === "dark" ? "bg-[oklch(0.16_0.02_265)]" : "bg-white"}`}>
                    <div className={`m-2 h-2 w-1/2 rounded ${t === "dark" ? "bg-white/20" : "bg-black/10"}`} />
                    <div className={`m-2 h-2 w-1/3 rounded ${t === "dark" ? "bg-white/10" : "bg-black/5"}`} />
                  </div>
                  <div className="text-sm font-medium capitalize">{t}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
