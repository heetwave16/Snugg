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

const TABS = ["Feed", "Albums", "Vault", "People"] as const;

function GroupPage() {
  const { groupId } = Route.useParams();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Feed");
  const [vaultSubTab, setVaultSubTab] = useState<"polls" | "capsules">("polls");
  const [showUpload, setShowUpload] = useState(false);
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
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowUpload((v) => !v)}
            className="press h-8 rounded-full px-3 text-xs font-semibold"
          >
            {showUpload ? "Done" : "+ Add"}
          </Button>
          <Link to="/home" className="press rounded-xl bg-secondary p-2" aria-label="Back">
            <ArrowLeft className="size-4" strokeWidth={1.8} />
          </Link>
        </div>
      }
    >
      {showUpload ? (
        <div className="rise mb-4">
          <UploadSheet
            groupId={groupId}
            onUploaded={() => {
              setShowUpload(false);
              media.refetch();
            }}
          />
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-4 rounded-2xl border border-border/50 bg-secondary/60 p-1 backdrop-blur-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "press rounded-xl py-2 text-center text-xs font-semibold transition-all",
              tab === t
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

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

      {tab === "Albums" ? <AlbumsTab groupId={groupId} /> : null}

      {tab === "Vault" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setVaultSubTab("polls")}
              className={cn(
                "press flex-1 rounded-xl py-1.5 text-xs font-semibold",
                vaultSubTab === "polls" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              Photo Polls
            </button>
            <button
              onClick={() => setVaultSubTab("capsules")}
              className={cn(
                "press flex-1 rounded-xl py-1.5 text-xs font-semibold",
                vaultSubTab === "capsules" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              Time Capsules
            </button>
          </div>
          {vaultSubTab === "polls" ? (
            <PollsTab
              groupId={groupId}
              media={media.data ?? []}
              members={members.data ?? []}
              currentUserId={currentUserId}
              isAdmin={!!isAdmin}
            />
          ) : (
            <CapsulesTab
              groupId={groupId}
              media={media.data ?? []}
              currentUserId={currentUserId}
              isAdmin={!!isAdmin}
              onChanged={() => media.refetch()}
            />
          )}
        </div>
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
