import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Send, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signPaths } from "@/lib/media";
import { groupMemberIds, notifyMembers } from "@/lib/notify";
import { REACTION_EMOJIS, type MediaRow, type MemberRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  items: MediaRow[];
  startIndex: number;
  members: MemberRow[];
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onChanged?: () => void;
};

export function MediaViewer({
  items,
  startIndex,
  members,
  currentUserId,
  isAdmin,
  onClose,
  onChanged,
}: Props) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [showTagger, setShowTagger] = useState(false);
  const [draft, setDraft] = useState("");
  const pinchStart = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const queryClient = useQueryClient();

  const item = items[index];

  useEffect(() => {
    setScale(1);
    setShowTagger(false);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, items.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, onClose]);

  const { data: url } = useQuery({
    queryKey: ["signed-full", item?.storage_path],
    queryFn: async () => (await signPaths([item?.storage_path]))[item!.storage_path],
    enabled: !!item,
  });

  const social = useQuery({
    queryKey: ["social", item?.id],
    enabled: !!item,
    queryFn: async () => {
      const [reactions, comments, tags] = await Promise.all([
        supabase.from("reactions").select("id,user_id,emoji").eq("media_id", item!.id),
        supabase
          .from("comments")
          .select("id,user_id,body,created_at")
          .eq("media_id", item!.id)
          .order("created_at"),
        supabase.from("tags").select("id,tagged_user_id,tagged_by").eq("media_id", item!.id),
      ]);
      return {
        reactions: reactions.data ?? [],
        comments: comments.data ?? [],
        tags: tags.data ?? [],
      };
    },
  });

  const nameOf = (userId: string) =>
    members.find((m) => m.user_id === userId)?.profiles?.display_name ?? "Someone";

  const react = useMutation({
    mutationFn: async (emoji: string) => {
      const mine = social.data?.reactions.find((r) => r.user_id === currentUserId);
      if (mine && mine.emoji === emoji) {
        await supabase.from("reactions").delete().eq("id", mine.id);
        return;
      }
      if (mine) {
        await supabase.from("reactions").update({ emoji }).eq("id", mine.id);
        return;
      }
      const { error } = await supabase
        .from("reactions")
        .insert({ media_id: item!.id, user_id: currentUserId, emoji });
      if (error) throw error;
    },
    onSuccess: () => social.refetch(),
    onError: (e: Error) => toast.error(e.message),
  });

  const comment = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase
        .from("comments")
        .insert({ media_id: item!.id, user_id: currentUserId, body });
      if (error) throw error;
      await notifyMembers({
        groupId: item!.group_id,
        mediaId: item!.id,
        type: "comment",
        body: `${nameOf(currentUserId)} commented: ${body.slice(0, 60)}`,
        userIds: await groupMemberIds(item!.group_id),
      });
    },
    onSuccess: () => {
      setDraft("");
      social.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addTag = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("tags")
        .insert({ media_id: item!.id, tagged_user_id: userId, tagged_by: currentUserId });
      if (error) throw error;
      await notifyMembers({
        groupId: item!.group_id,
        mediaId: item!.id,
        type: "tag",
        body: `${nameOf(currentUserId)} tagged you in a photo`,
        userIds: [userId],
      });
    },
    onSuccess: () => {
      toast.success("Tagged");
      setShowTagger(false);
      social.refetch();
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", tagId);
      if (error) throw error;
    },
    onSuccess: () => social.refetch(),
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMedia = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("media").delete().eq("id", item!.id);
      if (error) throw error;
      await supabase.storage
        .from("media")
        .remove([item!.storage_path, item!.thumb_path].filter((p): p is string => !!p));
    },
    onSuccess: () => {
      toast.success("Removed");
      onChanged?.();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!item) return null;

  const myReaction = social.data?.reactions.find((r) => r.user_id === currentUserId)?.emoji;
  const canDelete = isAdmin || item.uploader_id === currentUserId;
  const untagged = members.filter(
    (m) => !social.data?.tags.some((t) => t.tagged_user_id === m.user_id),
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 text-background backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="press rounded-full bg-background/15 p-2">
          <X className="size-5" strokeWidth={1.8} />
        </button>
        <p className="text-xs opacity-80">
          {index + 1} / {items.length} · {nameOf(item.uploader_id)}
        </p>
        {canDelete ? (
          <button
            onClick={() => removeMedia.mutate()}
            className="press rounded-full bg-background/15 p-2"
            aria-label="Delete"
          >
            <Trash2 className="size-5" strokeWidth={1.8} />
          </button>
        ) : (
          <span className="size-9" />
        )}
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const [a, b] = [e.touches[0]!, e.touches[1]!];
            pinchStart.current = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          } else if (e.touches.length === 1) {
            touchStart.current = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinchStart.current) {
            const [a, b] = [e.touches[0]!, e.touches[1]!];
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            setScale(Math.min(4, Math.max(1, (dist / pinchStart.current) * scale)));
          }
        }}
        onTouchEnd={(e) => {
          pinchStart.current = null;
          const start = touchStart.current;
          touchStart.current = null;
          if (!start || scale > 1.05) return;
          const end = e.changedTouches[0];
          if (!end) return;
          const dx = end.clientX - start.x;
          if (Math.abs(dx) > 60 && Math.abs(end.clientY - start.y) < 80) {
            setIndex((i) =>
              dx < 0 ? Math.min(i + 1, items.length - 1) : Math.max(i - 1, 0),
            );
          }
        }}
        onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2.2))}
      >
        {index > 0 ? (
          <button
            onClick={() => setIndex(index - 1)}
            className="press absolute left-2 z-10 hidden rounded-full bg-background/15 p-2 sm:block"
          >
            <ChevronLeft className="size-6" strokeWidth={1.8} />
          </button>
        ) : null}
        {url && item.kind === "video" ? (
          <video src={url} controls playsInline className="max-h-full max-w-full" />
        ) : url ? (
          <img
            src={url}
            alt={item.caption ?? "Memory"}
            style={{ transform: `scale(${scale})` }}
            className="max-h-full max-w-full origin-center object-contain transition-transform duration-200"
          />
        ) : (
          <span className="size-40 animate-pulse rounded-2xl bg-background/10" />
        )}
        {index < items.length - 1 ? (
          <button
            onClick={() => setIndex(index + 1)}
            className="press absolute right-2 z-10 hidden rounded-full bg-background/15 p-2 sm:block"
          >
            <ChevronRight className="size-6" strokeWidth={1.8} />
          </button>
        ) : null}
      </div>

      <div className="max-h-[46vh] overflow-y-auto rounded-t-3xl bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-foreground">
        <div className="flex flex-wrap gap-2">
          {REACTION_EMOJIS.map((emoji) => {
            const count = social.data?.reactions.filter((r) => r.emoji === emoji).length ?? 0;
            return (
              <button
                key={emoji}
                onClick={() => react.mutate(emoji)}
                className={cn(
                  "press flex items-center gap-1 rounded-full px-3 py-1.5 text-sm",
                  myReaction === emoji ? "bg-primary/15 ring-1 ring-primary" : "bg-secondary",
                )}
              >
                <span>{emoji}</span>
                {count > 0 ? <span className="text-xs text-muted-foreground">{count}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {social.data?.tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground"
            >
              @{nameOf(tag.tagged_user_id)}
              {tag.tagged_user_id === currentUserId ||
              tag.tagged_by === currentUserId ||
              isAdmin ? (
                <button onClick={() => removeTag.mutate(tag.id)} aria-label="Remove tag">
                  <X className="size-3" />
                </button>
              ) : null}
            </span>
          ))}
          <button
            onClick={() => setShowTagger((v) => !v)}
            className="press flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
          >
            <Tag className="size-3" strokeWidth={1.8} /> Tag someone
          </button>
        </div>

        {showTagger ? (
          <div className="rise mt-2 flex flex-wrap gap-2">
            {untagged.map((m) => (
              <button
                key={m.user_id}
                onClick={() => addTag.mutate(m.user_id)}
                className="press rounded-full bg-primary/12 px-3 py-1 text-xs text-primary"
              >
                @{m.profiles?.display_name ?? "friend"}
              </button>
            ))}
            {untagged.length === 0 ? (
              <p className="text-xs text-muted-foreground">Everyone is tagged already.</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 space-y-2.5">
          {social.data?.comments.map((c) => (
            <div key={c.id} className="rise text-sm">
              <span className="font-semibold">{nameOf(c.user_id)}</span>{" "}
              <span className="text-muted-foreground">{c.body}</span>
              {c.user_id === currentUserId || isAdmin ? (
                <button
                  className="ml-2 text-xs text-muted-foreground underline"
                  onClick={async () => {
                    await supabase.from("comments").delete().eq("id", c.id);
                    social.refetch();
                  }}
                >
                  delete
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) comment.mutate(draft.trim());
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            className="rounded-xl"
          />
          <Button type="submit" size="icon" className="press rounded-xl" disabled={!draft.trim()}>
            <Send className="size-4" strokeWidth={1.8} />
          </Button>
        </form>
      </div>
    </div>
  );
}
