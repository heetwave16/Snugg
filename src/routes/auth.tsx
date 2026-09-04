import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in to Snugg" },
      { name: "description", content: "Sign in to Snugg with a magic link — no password needed." },
      { property: "og:title", content: "Sign in to Snugg" },
      { property: "og:description", content: "Passwordless sign-in for your private scrapbook." },
    ],
  }),
  component: AuthPage,
});

function safePath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/home";
  return value;
}

function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const target = safePath(search.redirect);

  useEffect(() => {
    if (!loading && user) navigate({ to: target, replace: true });
  }, [loading, user, navigate, target]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${target}` },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="paper flex min-h-screen items-center justify-center bg-background px-6">
      <div className="rise card-soft w-full max-w-sm p-7">
        <h1 className="text-3xl font-semibold">Welcome to Snugg</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We'll email you a magic link. No passwords, ever.
        </p>

        {sent ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl bg-accent/60 p-5 text-center">
            <MailCheck className="size-7 text-primary" strokeWidth={1.6} />
            <p className="text-sm font-medium">Check {email}</p>
            <p className="text-xs text-muted-foreground">
              Tap the link on this device to hop straight in.
            </p>
            <button
              className="mt-1 text-xs underline text-muted-foreground"
              onClick={() => setSent(false)}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={sendLink} className="mt-6 space-y-3">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 rounded-2xl"
            />
            <Button
              type="submit"
              disabled={busy}
              className="press h-12 w-full rounded-2xl text-base"
            >
              {busy ? "Sending…" : "Send magic link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
