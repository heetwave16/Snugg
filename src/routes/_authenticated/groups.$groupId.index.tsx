import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { UploadSheet } from "@/components/UploadSheet";
import { AlbumsTab } from "@/components/group/AlbumsTab";
import { CapsulesTab } from "@/components/group/CapsulesTab";
import { FeedTab } from "@/components/group/FeedTab";
import { MembersTab } from "@/components/group/MembersTab";
import { PollsTab } from "@/components/group/PollsTab";
import { useGroup, useGroupMedia } from "@/hooks/use-group";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/groups/$groupId/")({
  head: () => ({
    meta: [
      { title: "Group — Snugg" },
      { name: "description", content: "Albums, feed, polls and time capsules for your group." },
      { property: "og:title", content: "Group — Snugg" },
      { property: "og:description", content: "Your group's shared albums and memories." },
    ],
  }),
  component: GroupPage,
});

const TABS = ["Albums", "Feed", "Upload", "Polls", "Capsules", "People"] as const;

function GroupPage() {
  const { groupId } = Route.useParams();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Albums");
  const { group, members } = useGroup(groupId);
  const media = useGroupMedia(groupId);
  const { user } = useSession();
  const queryClient = useQueryClient();
  const currentUserId = user?.id ?? "";
  const isAdmin = members.data?.some((m) => m.user_id === currentUserId && m.role === "admin");

  useEffect(() => {
    const channel = supabase
      .channel(`group-media-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "media", filter: `group_id=eq.${groupId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["media", groupId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  if (!group.isLoading && !group.data) {
    return (
      <AppShell
        title="Group not found"
        action={
          <Link to="/home" className="press rounded-xl bg-secondary p-2" aria-label="Back">
            <ArrowLeft className="size-4" strokeWidth={1.8} />
          </Link>
        }
      >
        <EmptyState
          title="Group not found"
          body="This group may have been deleted, or you may not be a member."
          action={
            <Button asChild className="press mt-2 rounded-xl">
              <Link to="/home">Back to your groups</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={group.data?.name ?? "Group"}
      subtitle={`${members.data?.length ?? 0} members · ${media.data?.length ?? 0} memories`}
      action={
        <Link to="/home" className="press rounded-xl bg-secondary p-2" aria-label="Back">
          <ArrowLeft className="size-4" strokeWidth={1.8} />
        </Link>
      }
    >
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "press shrink-0 rounded-full px-4 py-2 text-sm",
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Albums" ? <AlbumsTab groupId={groupId} /> : null}
      {tab === "Feed" ? (
        <FeedTab
          groupId={groupId}
          media={media.data ?? []}
          members={members.data ?? []}
          currentUserId={currentUserId}
          isAdmin={!!isAdmin}
          onChanged={() => media.refetch()}
        />
      ) : null}
      {tab === "Upload" ? (
        <UploadSheet groupId={groupId} onUploaded={() => media.refetch()} />
      ) : null}
      {tab === "Polls" ? (
        <PollsTab
          groupId={groupId}
          media={media.data ?? []}
          members={members.data ?? []}
          currentUserId={currentUserId}
          isAdmin={!!isAdmin}
        />
      ) : null}
      {tab === "Capsules" ? (
        <CapsulesTab
          groupId={groupId}
          media={media.data ?? []}
          currentUserId={currentUserId}
          isAdmin={!!isAdmin}
          onChanged={() => media.refetch()}
        />
      ) : null}
      {tab === "People" && group.data ? (
        <MembersTab
          group={group.data}
          members={members.data ?? []}
          currentUserId={currentUserId}
          isAdmin={!!isAdmin}
        />
      ) : null}
    </AppShell>
  );
}
