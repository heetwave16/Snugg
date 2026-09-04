import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Snugg" },
      { name: "description", content: "Your name, privacy choices and account controls." },
      { property: "og:title", content: "Your profile — Snugg" },
      { property: "og:description", content: "Your name, privacy choices and account controls." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile.data?.display_name) setName(profile.data.display_name);
  }, [profile.data?.display_name]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      profile.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const me = user!.id;
      const { data: mine } = await supabase
        .from("media")
        .select("id,storage_path,thumb_path")
        .eq("uploader_id", me);
      const paths = (mine ?? []).flatMap((m) =>
        [m.storage_path, m.thumb_path].filter((p): p is string => !!p),
      );
      if (paths.length) await supabase.storage.from("media").remove(paths);
      await supabase.from("media").delete().eq("uploader_id", me);
      await supabase.from("tags").delete().eq("tagged_user_id", me);
      await supabase.from("comments").delete().eq("user_id", me);
      await supabase.from("reactions").delete().eq("user_id", me);
      await supabase.from("poll_votes").delete().eq("user_id", me);
      await supabase.from("group_members").delete().eq("user_id", me);
      await supabase.from("notifications").delete().eq("user_id", me);
      const { error } = await supabase.from("profiles").delete().eq("id", me);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Your data has been deleted");
      queryClient.clear();
      await supabase.auth.signOut();
      navigate({ to: "/", replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="You" subtitle={user?.email ?? ""}>
      <div className="space-y-5">
        <section className="rise card-soft space-y-3 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <Button
            className="press h-11 w-full rounded-xl"
            disabled={!name.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            Save
          </Button>
        </section>

        <section className="rise card-soft space-y-2 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="size-4 text-primary" strokeWidth={1.8} /> Privacy
          </h2>
          <p className="text-sm text-muted-foreground">
            Snugg is invite-only: your photos are visible only to members of the groups you share
            them with. You consented to appearing in and being tagged in group photos
            {profile.data?.consented_at
              ? ` on ${new Date(profile.data.consented_at).toLocaleDateString()}`
              : ""}
            . You can remove yourself from any tag, delete your own uploads, or delete everything
            below.
          </p>
        </section>

        <Button
          variant="secondary"
          className="press h-11 w-full rounded-xl"
          onClick={signOut}
        >
          <LogOut className="size-4" strokeWidth={1.8} /> Sign out
        </Button>

        <Button
          variant="ghost"
          className="press h-11 w-full rounded-xl text-destructive"
          onClick={() => {
            if (window.confirm("Delete your account and all your data? This can't be undone.")) {
              deleteAccount.mutate();
            }
          }}
        >
          <Trash2 className="size-4" strokeWidth={1.8} /> Delete my account and data
        </Button>
      </div>
    </AppShell>
  );
}
