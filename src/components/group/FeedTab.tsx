import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Search, UserRoundCheck, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/AppShell";
import { MediaGrid } from "@/components/MediaGrid";
import { MediaViewer } from "@/components/MediaViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { downloadZip } from "@/lib/media";
import type { MediaRow, MemberRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FeedTab({
  groupId,
  media,
  members,
  currentUserId,
  isAdmin,
  onChanged,
}: {
  groupId: string;
  media: MediaRow[];
  members: MemberRow[];
  currentUserId: string;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [uploader, setUploader] = useState<string | null>(null);
  const [tagged, setTagged] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const tags = useQuery({
    queryKey: ["tags", groupId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tags")
        .select("media_id,tagged_user_id,media!inner(group_id)")
        .eq("media.group_id", groupId);
      return (data ?? []) as unknown as { media_id: string; tagged_user_id: string }[];
    },
  });

  const filtered = useMemo(() => {
    return media.filter((m) => {
      if (uploader && m.uploader_id !== uploader) return false;
      if (from && m.created_at < from) return false;
      if (to && m.created_at > `${to}T23:59:59`) return false;
      if (text && !(m.caption ?? "").toLowerCase().includes(text.toLowerCase())) return false;
      if (tagged) {
        const hit = tags.data?.some((t) => t.media_id === m.id && t.tagged_user_id === tagged);
        if (!hit) return false;
      }
      return true;
    });
  }, [media, uploader, tagged, from, to, text, tags.data]);

  const grouped = useMemo(() => {
    const map = new Map<string, MediaRow[]>();
    for (const m of filtered) {
      const key = new Date(m.created_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flat = grouped.flatMap(([, rows]) => rows);

  async function zip(items: MediaRow[], name: string) {
    if (!items.length) return;
    toast.info("Zipping your memories…");
    await downloadZip(
      items.map((m, i) => ({
        path: m.storage_path,
        name: `${String(i + 1).padStart(3, "0")}-${m.storage_path.split("/").pop()}`,
      })),
      name,
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-soft space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" strokeWidth={1.7} />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search captions"
            className="h-10 rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 rounded-xl"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 rounded-xl"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTagged(tagged === currentUserId ? null : currentUserId)}
            className={cn(
              "press flex items-center gap-1 rounded-full px-3 py-1.5 text-xs",
              tagged === currentUserId ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            <UserRoundCheck className="size-3.5" strokeWidth={1.8} /> Photos of me
          </button>
          {members.map((m) => (
            <button
              key={m.user_id}
              onClick={() => setUploader(uploader === m.user_id ? null : m.user_id)}
              className={cn(
                "press rounded-full px-3 py-1.5 text-xs",
                uploader === m.user_id ? "bg-primary text-primary-foreground" : "bg-secondary",
              )}
            >
              by {m.profiles?.display_name ?? "friend"}
            </button>
          ))}
          {uploader || tagged || from || to || text ? (
            <button
              onClick={() => {
                setUploader(null);
                setTagged(null);
                setFrom("");
                setTo("");
                setText("");
              }}
              className="press flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs"
            >
              <X className="size-3" /> clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="press rounded-xl"
          onClick={() => zip(filtered, "snugg-all.zip")}
        >
          <Download className="size-4" strokeWidth={1.8} /> Download all ({filtered.length})
        </Button>
        <Button
          variant={selecting ? "default" : "secondary"}
          size="sm"
          className="press rounded-xl"
          onClick={() => {
            setSelecting((v) => !v);
            setSelected(new Set());
          }}
        >
          {selecting ? "Done selecting" : "Select"}
        </Button>
        {selecting && selected.size > 0 ? (
          <Button
            size="sm"
            className="press rounded-xl"
            onClick={() => zip(flat.filter((m) => selected.has(m.id)), "snugg-selected.zip")}
          >
            <Download className="size-4" strokeWidth={1.8} /> Download {selected.size}
          </Button>
        ) : null}
      </div>

      {grouped.length ? (
        grouped.map(([day, rows]) => (
          <section key={day} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{day}</h3>
            <MediaGrid
              items={rows}
              selecting={selecting}
              selected={selected}
              onToggle={(id) =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onOpen={(i) => setViewerIndex(flat.indexOf(rows[i]!))}
            />
          </section>
        ))
      ) : (
        <EmptyState title="Nothing here yet" body="Upload something, or loosen your filters." />
      )}

      {viewerIndex !== null ? (
        <MediaViewer
          items={flat}
          startIndex={viewerIndex}
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onClose={() => setViewerIndex(null)}
          onChanged={onChanged}
        />
      ) : null}
    </div>
  );
}
