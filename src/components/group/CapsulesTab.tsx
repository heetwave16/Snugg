import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Hourglass, Lock, LockOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/AppShell";
import { MediaGrid } from "@/components/MediaGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { MediaRow } from "@/lib/types";

type CapsuleRow = {
  id: string;
  title: string;
  unlock_at: string;
  created_by: string;
};

export function CapsulesTab({
  groupId,
  media,
  currentUserId,
  isAdmin,
  onChanged,
}: {
  groupId: string;
  media: MediaRow[];
  currentUserId: string;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const capsules = useQuery({
    queryKey: ["capsules", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_capsules")
        .select("id,title,unlock_at,created_by")
        .eq("group_id", groupId)
        .order("unlock_at");
      if (error) throw error;
      return (data ?? []) as CapsuleRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const unlockIso = new Date(unlockAt).toISOString();
      const { data: capsule, error } = await supabase
        .from("time_capsules")
        .insert({
          group_id: groupId,
          title: title.trim(),
          unlock_at: unlockIso,
          created_by: currentUserId,
        })
        .select("id")
        .single();
      if (error) throw error;
      const ids = Array.from(picked);
      if (ids.length) {
        const { error: linkError } = await supabase
          .from("time_capsule_media")
          .insert(ids.map((mediaId) => ({ capsule_id: capsule.id, media_id: mediaId })));
        if (linkError) throw linkError;
        const { error: lockError } = await supabase
          .from("media")
          .update({ locked_until: unlockIso })
          .in("id", ids);
        if (lockError) throw lockError;
      }
    },
    onSuccess: () => {
      setTitle("");
      setUnlockAt("");
      setPicked(new Set());
      setCreating(false);
      queryClient.invalidateQueries({ queryKey: ["capsules", groupId] });
      onChanged();
      toast.success("Sealed until the big day");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {creating ? (
        <div className="rise card-soft space-y-3 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="capsule-title">Capsule name</Label>
            <Input
              id="capsule-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Open on our 10th reunion"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capsule-date">Unlock date</Label>
            <Input
              id="capsule-date"
              type="datetime-local"
              value={unlockAt}
              onChange={(e) => setUnlockAt(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Choose photos to seal ({picked.size} chosen). They stay hidden from the group until the
            unlock date.
          </p>
          <div className="max-h-72 overflow-y-auto">
            <MediaGrid
              items={media.slice(0, 60)}
              selecting
              selected={picked}
              onToggle={(id) =>
                setPicked((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onOpen={() => undefined}
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="press h-11 flex-1 rounded-xl"
              disabled={!title.trim() || !unlockAt || picked.size === 0 || create.isPending}
              onClick={() => create.mutate()}
            >
              Seal capsule
            </Button>
            <Button
              variant="ghost"
              className="press h-11 rounded-xl"
              onClick={() => setCreating(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          className="press h-11 w-full rounded-xl"
          onClick={() => setCreating(true)}
        >
          <Plus className="size-4" strokeWidth={2} /> New time capsule
        </Button>
      )}

      {capsules.isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : capsules.data?.length ? (
        capsules.data.map((capsule) => {
          const unlocked = new Date(capsule.unlock_at) <= new Date();
          const days = Math.ceil(
            (new Date(capsule.unlock_at).getTime() - Date.now()) / 86_400_000,
          );
          return (
            <div key={capsule.id} className="rise card-soft flex items-center gap-3 p-4">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                {unlocked ? (
                  <LockOpen className="size-5" strokeWidth={1.7} />
                ) : (
                  <Lock className="size-5" strokeWidth={1.7} />
                )}
              </span>
              <div className="flex-1">
                <h3 className="font-semibold">{capsule.title}</h3>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Hourglass className="size-3.5" strokeWidth={1.7} />
                  {unlocked
                    ? `revealed ${new Date(capsule.unlock_at).toLocaleDateString()}`
                    : `unlocks in ${days} day${days === 1 ? "" : "s"}`}
                </p>
              </div>
              {isAdmin || capsule.created_by === currentUserId ? (
                <button
                  className="text-xs text-muted-foreground underline"
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Delete "${capsule.title}"? Photos in this capsule will be unlocked.`,
                      )
                    ) {
                      return;
                    }
                    try {
                      const { data: linked } = await supabase
                        .from("time_capsule_media")
                        .select("media_id")
                        .eq("capsule_id", capsule.id);
                      const mediaIds = (linked ?? []).map((l) => l.media_id);
                      if (mediaIds.length) {
                        await supabase
                          .from("media")
                          .update({ locked_until: null })
                          .in("id", mediaIds);
                      }
                      const { error } = await supabase
                        .from("time_capsules")
                        .delete()
                        .eq("id", capsule.id);
                      if (error) throw error;
                      queryClient.invalidateQueries({ queryKey: ["capsules", groupId] });
                      queryClient.invalidateQueries({ queryKey: ["media", groupId] });
                      onChanged();
                      toast.success("Time capsule deleted and photos unlocked");
                    } catch (err) {
                      toast.error((err as Error).message);
                    }
                  }}
                >
                  delete
                </button>
              ) : null}
            </div>
          );
        })
      ) : (
        <EmptyState
          title="No capsules yet"
          body="Seal a few photos away and let them surprise the group later."
        />
      )}
    </div>
  );
}
