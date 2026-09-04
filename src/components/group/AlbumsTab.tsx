import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { AlbumRow } from "@/lib/types";

export function AlbumsTab({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const queryClient = useQueryClient();

  const albums = useQuery({
    queryKey: ["albums", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .eq("group_id", groupId)
        .order("event_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as AlbumRow[];
    },
  });

  const counts = useQuery({
    queryKey: ["album-counts", groupId, albums.data?.length],
    enabled: !!albums.data?.length,
    queryFn: async () => {
      const entries = await Promise.all(
        (albums.data ?? []).map(async (a) => {
          const { count } = await supabase
            .from("media")
            .select("id", { count: "exact", head: true })
            .eq("album_id", a.id);
          return [a.id, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries);
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("albums").insert({
        group_id: groupId,
        title: title.trim(),
        event_date: date || null,
        created_by: auth.user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setDate("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["albums", groupId] });
      toast.success("Album created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {open ? (
        <div className="rise card-soft space-y-3 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="album-title">Album title</Label>
            <Input
              id="album-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ananya's birthday"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="album-date">Event date</Label>
            <Input
              id="album-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="press h-11 flex-1 rounded-xl"
              disabled={!title.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              Save album
            </Button>
            <Button
              variant="ghost"
              className="press h-11 rounded-xl"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          className="press h-11 w-full rounded-xl"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" strokeWidth={2} /> New event album
        </Button>
      )}

      {albums.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-sand" />
          ))}
        </div>
      ) : albums.data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {albums.data.map((album, i) => (
            <Link
              key={album.id}
              to="/groups/$groupId/albums/$albumId"
              params={{ groupId, albumId: album.id }}
              style={{ animationDelay: `${i * 40}ms` }}
              className="rise press card-soft flex items-center justify-between gap-3 p-4"
            >
              <div>
                <h3 className="font-semibold">{album.title}</h3>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" strokeWidth={1.7} />
                  {album.event_date ?? "no date"}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                {counts.data?.[album.id] ?? 0}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No albums yet" body="Create an album for your next (or last) event." />
      )}
    </div>
  );
}
