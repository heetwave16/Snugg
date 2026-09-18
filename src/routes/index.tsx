import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Camera, Lock, Sparkles } from "lucide-react";
import heroCollage from "@/assets/hero-collage.jpg";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Snugg — private photo sharing for your friend group" },
      {
        name: "description",
        content:
          "Snugg is an invite-only shared scrapbook: albums, reactions, time capsules and polls for your closest friends.",
      },
      { property: "og:title", content: "Snugg — private photo sharing for your friend group" },
      {
        property: "og:description",
        content: "An invite-only shared scrapbook for the people you actually know.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/home", replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-5 pb-16 pt-12">
        <div className="rise">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
            Private & Invite-Only
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Snugg
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A private shared camera roll for you and your friends. No stranger feeds, no algorithms —
            just your crew and the memories you made together.
          </p>
        </div>

        <div className="rise overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg">
          <img
            src={heroCollage}
            alt="Photos of friends shared together"
            width={1280}
            height={960}
            className="w-full object-cover"
          />
        </div>

        <div className="rise space-y-2.5 rounded-3xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm">
          <Feature icon={<Camera className="size-4" strokeWidth={2} />}>
            Event albums, chronological grid & swipe viewer
          </Feature>
          <Feature icon={<Sparkles className="size-4" strokeWidth={2} />}>
            Reactions, comments, member tagging & "Photos of me"
          </Feature>
          <Feature icon={<Lock className="size-4" strokeWidth={2} />}>
            Time capsules that unlock on future dates
          </Feature>
        </div>

        <div className="rise space-y-3 pt-2">
          <Button asChild size="lg" className="press h-12 w-full rounded-full text-sm font-semibold shadow-md">
            <Link to="/auth">Get Started with Magic Link</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Install on your Android or iOS home screen for the full native app feel.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium text-foreground">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}
