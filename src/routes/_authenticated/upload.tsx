import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { UploadSheet } from "@/components/UploadSheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { AlbumRow, GroupRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title: "Upload memories — Snugg" },
      {
        name: "description",
        content: "Add photos and videos to a group album — compressed automatically.",
      },
      { property: "og:title", content: "Upload memories — Snugg" },
      { property: "og:description", content: "Add photos and videos to your group album." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [albumId, setAlbumId] = useState<string | null>(null);

  const groups = useQuery({
    queryKey: ["my-groups-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.from("group_members").select("groups(*)");
      if (error) throw error;
      return (data ?? [])
        .map((row) => (row as unknown as { groups: GroupRow | null }).groups)
        .filter((g): g is GroupRow => !!g);
    },
  });

  const albums = useQuery({
    queryKey: ["albums", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .eq("group_id", groupId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AlbumRow[];
    },
  });

  return (
    <AppShell title="Upload" subtitle="Pick a group, then an album">
      {groups.isLoading ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-muted" />
            ))}
          </div>
          <div className="h-44 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : groups.data?.length ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {groups.data.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setGroupId(g.id);
                  setAlbumId(null);
                }}
                className={cn(
                  "press rounded-full px-4 py-2 text-sm",
                  groupId === g.id ? "bg-primary text-primary-foreground" : "bg-secondary",
                )}
              >
                {g.name}
              </button>
            ))}
          </div>

          {groupId ? (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAlbumId(null)}
                  className={cn(
                    "press rounded-full px-4 py-2 text-xs",
                    albumId === null ? "bg-accent text-accent-foreground" : "bg-secondary",
                  )}
                >
                  No album
                </button>
                {albums.data?.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAlbumId(a.id)}
                    className={cn(
                      "press rounded-full px-4 py-2 text-xs",
                      albumId === a.id ? "bg-accent text-accent-foreground" : "bg-secondary",
                    )}
                  >
                    {a.title}
                  </button>
                ))}
              </div>
              <UploadSheet groupId={groupId} albumId={albumId} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Choose a group above to start.</p>
          )}
        </div>
      ) : (
        <EmptyState
          title="No groups yet"
          body="You need a group before you can upload."
          action={
            <Button asChild className="press mt-2 rounded-xl">
              <Link to="/groups">Create or join a group</Link>
            </Button>
          }
        />
      )}
    </AppShell>
  );
}
