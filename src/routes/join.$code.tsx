import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/join/$code")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join a Snugg group" },
      { name: "description", content: "You've been invited to a private Snugg group." },
      { property: "og:title", content: "Join a Snugg group" },
      { property: "og:description", content: "You've been invited to a private Snugg group." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { code } = Route.useParams();
  const { user, loading } = useSession();
  const [consent, setConsent] = useState(false);
  const navigate = useNavigate();

  const preview = useQuery({
    queryKey: ["invite", code],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("group_preview_by_code", { _code: code });
      if (error) throw error;
      return (data ?? [])[0] as { id: string; name: string } | undefined;
    },
  });

  const join = useMutation({
    mutationFn: async () => {
      const groupId = preview.data?.id;
      if (!groupId) throw new Error("Invite not found");
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: user!.id, consented: true });
      if (error && !error.message.includes("duplicate")) throw error;
      await supabase
        .from("profiles")
        .update({ consented_at: new Date().toISOString() })
        .eq("id", user!.id);
      return groupId;
    },
    onSuccess: (groupId) => navigate({ to: "/groups/$groupId", params: { groupId } }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="rise card-soft w-full max-w-sm space-y-4 p-7 text-center">
        <PartyPopper className="mx-auto size-8 text-primary" strokeWidth={1.6} />
        <h1 className="text-2xl font-semibold">You're invited</h1>

        {loading ? (
          <p className="text-sm text-muted-foreground">One sec…</p>
        ) : !user ? (
          <>
            <p className="text-sm text-muted-foreground">
              Sign in first and we'll bring you right back to this invite.
            </p>
            <Button
              className="press h-11 w-full rounded-2xl"
              onClick={() =>
                navigate({ to: "/auth", search: { redirect: `/join/${code}` } })
              }
            >
              Sign in to join
            </Button>
          </>
        ) : preview.data ? (
          <>
            <p className="text-sm text-muted-foreground">
              Join <span className="font-semibold text-foreground">{preview.data.name}</span> and
              start sharing memories.
            </p>
            <label className="flex items-start gap-2 text-left text-xs text-muted-foreground">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5"
              />
              I consent to appearing in photos shared inside this group, and to being tagged by
              members.
            </label>
            <Button
              className="press h-11 w-full rounded-2xl"
              disabled={!consent || join.isPending}
              onClick={() => join.mutate()}
            >
              Join group
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {preview.isLoading ? "Checking the invite…" : "That invite code doesn't exist."}
          </p>
        )}
      </div>
    </div>
  );
}
