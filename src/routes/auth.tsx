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

  async function signInWithGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${target}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${target}` },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        toast.error("Email rate limit exceeded. Please use Google Sign-In.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="rise card-soft w-full max-w-sm p-7">
        <h1 className="text-3xl font-semibold">Welcome to Snugg</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your private scrapbook.
        </p>

        <div className="mt-8">
          <Button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy}
            variant="default"
            className="press h-12 w-full rounded-2xl text-base font-medium flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 bg-white rounded-full p-0.5" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-accent/60 p-5 text-center">
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
          <form onSubmit={sendLink} className="space-y-3">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 rounded-2xl bg-background"
            />
            <Button
              type="submit"
              disabled={busy}
              variant="secondary"
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
