import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ImagePlus, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/groups/")({
  head: () => ({
    meta: [
      { title: "Create or join a group — Snugg" },
      {
        name: "description",
        content: "Start a private group for your friends or join one with an invite code.",
      },
      { property: "og:title", content: "Create or join a group — Snugg" },
      { property: "og:description", content: "Invite-only groups, shared scrapbooks." },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const [name, setName] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id;
      if (!me) throw new Error("Please sign in again");
      const { data: group, error } = await supabase
        .from("groups")
        .insert({ name: name.trim(), created_by: me })
        .select("*")
        .single();
      if (error) throw error;

      if (cover) {
        const { blob } = await compressImage(cover);
        const path = `${group.id}/cover-${crypto.randomUUID()}.jpg`;
        const up = await supabase.storage.from("media").upload(path, blob, { upsert: true });
        if (!up.error) {
          await supabase.from("groups").update({ cover_url: path }).eq("id", group.id);
        }
      }
      return group;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      toast.success(`${group.name} created · code ${group.invite_code}`);
      navigate({ to: "/groups/$groupId", params: { groupId: group.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const join = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id;
      if (!me) throw new Error("Please sign in again");
      const { data: groupId, error } = await supabase.rpc("group_id_by_code", {
        _code: code.trim(),
      });
      if (error) throw error;
      if (!groupId) throw new Error("That invite code doesn't match a group");
      const { error: joinError } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: me, consented: true });
      if (joinError && !joinError.message.includes("duplicate")) throw joinError;
      await supabase
        .from("profiles")
        .update({ consented_at: new Date().toISOString() })
        .eq("id", me);
      return groupId as string;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      toast.success("You're in!");
      navigate({ to: "/groups/$groupId", params: { groupId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Groups" subtitle="Start something or join the crew">
      <div className="space-y-5">
        <section className="rise card-soft space-y-3 p-5">
          <h2 className="text-lg font-semibold">Create a group</h2>
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goa 2019 & forever"
              className="h-11 rounded-xl"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="press flex w-full items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-left text-sm"
          >
            <ImagePlus className="size-5 text-primary" strokeWidth={1.6} />
            {cover ? cover.name : "Add a cover photo"}
          </button>
          <Button
            className="press h-11 w-full rounded-xl"
            disabled={!name.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Creating…" : "Create group"}
          </Button>
        </section>

        <section className="rise card-soft space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="size-4 text-primary" strokeWidth={1.7} /> Join with a code
          </h2>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. 7F2A9C1"
            className="h-11 rounded-xl tracking-[0.2em]"
          />
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              className="mt-0.5"
            />
            I consent to appearing in photos shared inside this group, and to being tagged by
            members.
          </label>
          <Button
            variant="secondary"
            className="press h-11 w-full rounded-xl"
            disabled={!code.trim() || !consent || join.isPending}
            onClick={() => join.mutate()}
          >
            {join.isPending ? "Joining…" : "Join group"}
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
