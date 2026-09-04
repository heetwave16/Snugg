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
    <div className="paper min-h-screen bg-background">
      <div className="mx-auto flex max-w-md flex-col gap-7 px-6 pb-16 pt-14">
        <div className="rise">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Invite only
          </p>
          <h1 className="mt-3 text-5xl font-semibold leading-[1.05] text-foreground">
            Snugg
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            A warm little scrapbook for one friend group. No feeds for strangers, no algorithms —
            just your people and the photos you took together.
          </p>
        </div>

        <img
          src={heroCollage}
          alt="Polaroid photos of friends scattered on cream linen"
          width={1280}
          height={960}
          className="rise w-full rounded-2xl object-cover shadow-lift"
        />

        <div className="rise card-soft space-y-3 p-5">
          <Feature icon={<Camera className="size-4" strokeWidth={1.7} />}>
            Event albums, a 3-column grid, and full-screen swipe viewing
          </Feature>
          <Feature icon={<Sparkles className="size-4" strokeWidth={1.7} />}>
            Reactions, comments, tagging and “photos of me”
          </Feature>
          <Feature icon={<Lock className="size-4" strokeWidth={1.7} />}>
            Time capsules that unlock on a future date
          </Feature>
        </div>

        <Button asChild size="lg" className="press h-12 rounded-2xl text-base">
          <Link to="/auth">Get your magic link</Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Add Snugg to your homescreen for the full app feel.
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
        {icon}
      </span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}
