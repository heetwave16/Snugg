import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BarChart3, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/AppShell";
import { MediaGrid } from "@/components/MediaGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { signPaths } from "@/lib/media";
import type { MediaRow, MemberRow } from "@/lib/types";

type PollRow = {
  id: string;
  question: string;
  created_by: string;
  created_at: string;
};

export function PollsTab({
  groupId,
  media,
  members,
  currentUserId,
  isAdmin,
}: {
  groupId: string;
  media: MediaRow[];
  members: MemberRow[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const polls = useQuery({
    queryKey: ["polls", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("id,question,created_by,created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PollRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: poll, error } = await supabase
        .from("polls")
        .insert({ group_id: groupId, question: question.trim(), created_by: currentUserId })
        .select("id")
        .single();
      if (error) throw error;
      const options = Array.from(picked).map((mediaId) => ({ poll_id: poll.id, media_id: mediaId }));
      if (options.length) {
        const { error: optError } = await supabase.from("poll_options").insert(options);
        if (optError) throw optError;
      }
    },
    onSuccess: () => {
      setQuestion("");
      setPicked(new Set());
      setCreating(false);
      queryClient.invalidateQueries({ queryKey: ["polls", groupId] });
      toast.success("Poll is live");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {creating ? (
        <div className="rise card-soft space-y-3 p-4">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Best photo of the trip?"
            className="h-11 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            Pick the photos to use as options ({picked.size} chosen)
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
              disabled={!question.trim() || picked.size < 2 || create.isPending}
              onClick={() => create.mutate()}
            >
              Start poll
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
          <Plus className="size-4" strokeWidth={2} /> New photo poll
        </Button>
      )}

      {polls.isLoading ? (
        <div className="h-44 animate-pulse rounded-2xl bg-sand" />
      ) : polls.data?.length ? (
        polls.data.map((poll) => (
          <Poll
            key={poll.id}
            poll={poll}
            groupId={groupId}
            members={members}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        ))
      ) : (
        <EmptyState title="No polls yet" body="Ask the group to crown the best photo." />
      )}
    </div>
  );
}

function Poll({
  poll,
  groupId,
  members,
  currentUserId,
  isAdmin,
}: {
  poll: PollRow;
  groupId: string;
  members: MemberRow[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();

  const data = useQuery({
    queryKey: ["poll", poll.id],
    queryFn: async () => {
      const [options, votes] = await Promise.all([
        supabase
          .from("poll_options")
          .select("id,label,media_id,media(storage_path,thumb_path)")
          .eq("poll_id", poll.id),
        supabase.from("poll_votes").select("id,option_id,user_id").eq("poll_id", poll.id),
      ]);
      const rows = (options.data ?? []) as unknown as {
        id: string;
        label: string | null;
        media_id: string | null;
        media: { storage_path: string; thumb_path: string | null } | null;
      }[];
      const urls = await signPaths(rows.map((r) => r.media?.thumb_path ?? r.media?.storage_path));
      return { rows, votes: votes.data ?? [], urls };
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`poll-${poll.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes", filter: `poll_id=eq.${poll.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["poll", poll.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [poll.id, queryClient]);

  const vote = useMutation({
    mutationFn: async (optionId: string) => {
      const mine = data.data?.votes.find((v) => v.user_id === currentUserId);
      if (mine) {
        const { error } = await supabase
          .from("poll_votes")
          .update({ option_id: optionId })
          .eq("id", mine.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("poll_votes")
        .insert({ poll_id: poll.id, option_id: optionId, user_id: currentUserId });
      if (error) throw error;
    },
    onSuccess: () => data.refetch(),
    onError: (e: Error) => toast.error(e.message),
  });

  const total = data.data?.votes.length ?? 0;
  const myVote = data.data?.votes.find((v) => v.user_id === currentUserId)?.option_id;
  const author = members.find((m) => m.user_id === poll.created_by)?.profiles?.display_name;

  return (
    <div className="rise card-soft space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{poll.question}</h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="size-3.5" strokeWidth={1.7} /> {total} vote
            {total === 1 ? "" : "s"} · by {author ?? "someone"}
          </p>
        </div>
        {isAdmin || poll.created_by === currentUserId ? (
          <button
            className="text-xs text-muted-foreground underline"
            onClick={async () => {
              await supabase.from("polls").delete().eq("id", poll.id);
              queryClient.invalidateQueries({ queryKey: ["polls", groupId] });
            }}
          >
            delete
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {data.data?.rows.map((option) => {
          const count = data.data.votes.filter((v) => v.option_id === option.id).length;
          const pct = total ? Math.round((count / total) * 100) : 0;
          const key = option.media?.thumb_path ?? option.media?.storage_path;
          const url = key ? data.data.urls[key] : undefined;
          return (
            <button
              key={option.id}
              onClick={() => vote.mutate(option.id)}
              className="press relative overflow-hidden rounded-xl bg-secondary text-left"
            >
              {url ? (
                <img src={url} alt="Poll option" loading="lazy" className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 items-center justify-center text-xs">
                  {option.label ?? "Option"}
                </div>
              )}
              <div className="flex items-center justify-between px-2 py-1.5 text-xs">
                <span className={myVote === option.id ? "font-semibold text-primary" : ""}>
                  {myVote === option.id ? "your pick" : "vote"}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-1 bg-border">
                <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
