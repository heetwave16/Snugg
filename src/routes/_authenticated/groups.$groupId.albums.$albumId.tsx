import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState } from "@/components/AppShell";
import { MediaGrid } from "@/components/MediaGrid";
import { MediaViewer } from "@/components/MediaViewer";
import { UploadSheet } from "@/components/UploadSheet";
import { Button } from "@/components/ui/button";
import { useGroup, useGroupMedia } from "@/hooks/use-group";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { downloadZip } from "@/lib/media";
import type { AlbumRow } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/groups/$groupId/albums/$albumId")({
  head: () => ({
    meta: [
      { title: "Album — Snugg" },
      { name: "description", content: "Photos and videos from this event album." },
      { property: "og:title", content: "Album — Snugg" },
      { property: "og:description", content: "Photos and videos from this event album." },
    ],
  }),
  component: AlbumPage,
});

function AlbumPage() {
  const { groupId, albumId } = Route.useParams();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const { members } = useGroup(groupId);
  const media = useGroupMedia(groupId, albumId);
  const { user } = useSession();
  const currentUserId = user?.id ?? "";
  const isAdmin = members.data?.some((m) => m.user_id === currentUserId && m.role === "admin");

  const album = useQuery({
    queryKey: ["album", albumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .eq("id", albumId)
        .maybeSingle();
      if (error) throw error;
      return data as AlbumRow | null;
    },
  });

  const items = media.data ?? [];

  async function zip(rows: typeof items, name: string) {
    if (!rows.length) return;
    toast.info("Zipping…");
    await downloadZip(
      rows.map((m, i) => ({
        path: m.storage_path,
        name: `${String(i + 1).padStart(3, "0")}-${m.storage_path.split("/").pop()}`,
      })),
      name,
    );
  }

  if (!album.isLoading && !album.data) {
    return (
      <AppShell
        title="Album not found"
        action={
          <Link
            to="/groups/$groupId"
            params={{ groupId }}
            className="press rounded-xl bg-secondary p-2"
            aria-label="Back to group"
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
          </Link>
        }
      >
        <EmptyState
          title="Album not found"
          body="This album may have been deleted, or the link is invalid."
          action={
            <Button asChild className="press mt-2 rounded-xl">
              <Link to="/groups/$groupId" params={{ groupId }}>
                Back to group
              </Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={album.data?.title ?? "Album"}
      subtitle={album.data?.event_date ?? `${items.length} items`}
      action={
        <Link
          to="/groups/$groupId"
          params={{ groupId }}
          className="press rounded-xl bg-secondary p-2"
          aria-label="Back to group"
        >
          <ArrowLeft className="size-4" strokeWidth={1.8} />
        </Link>
      }
    >
      <div className="space-y-4">
        <UploadSheet groupId={groupId} albumId={albumId} onUploaded={() => media.refetch()} />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="press rounded-xl"
            onClick={() => zip(items, "snugg-album.zip")}
          >
            <Download className="size-4" strokeWidth={1.8} /> Download all
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
            {selecting ? "Done" : "Select"}
          </Button>
          {selecting && selected.size ? (
            <Button
              size="sm"
              className="press rounded-xl"
              onClick={() => zip(items.filter((m) => selected.has(m.id)), "snugg-selected.zip")}
            >
              <Download className="size-4" strokeWidth={1.8} /> Download {selected.size}
            </Button>
          ) : null}
        </div>

        {items.length ? (
          <MediaGrid
            items={items}
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
            onOpen={(i) => setViewerIndex(i)}
          />
        ) : (
          <EmptyState title="Empty album" body="Add the first photos from this event." />
        )}
      </div>

      {viewerIndex !== null ? (
        <MediaViewer
          items={items}
          startIndex={viewerIndex}
          members={members.data ?? []}
          currentUserId={currentUserId}
          isAdmin={!!isAdmin}
          onClose={() => setViewerIndex(null)}
          onChanged={() => media.refetch()}
        />
      ) : null}
    </AppShell>
  );
}
