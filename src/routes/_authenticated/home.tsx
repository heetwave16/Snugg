import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarHeart, Images, Plus } from "lucide-react";
import { AppShell, EmptyState } from "@/components/AppShell";
import { VaultWidget } from "@/components/VaultWidget";
import { Button } from "@/components/ui/button";

import { supabase } from "@/integrations/supabase/client";
import { signPaths } from "@/lib/media";
import type { GroupRow } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your groups — Snugg" },
      { name: "description", content: "All your private friend groups and shared albums." },
      { property: "og:title", content: "Your groups — Snugg" },
      { property: "og:description", content: "All your private friend groups in one warm place." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const groups = useQuery({
    queryKey: ["my-groups"],
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from("group_members")
        .select("group_id, groups(*)")
        .order("joined_at", { ascending: false });
      if (error) throw error;
      const rows = (memberships ?? [])
        .map((m) => (m as unknown as { groups: GroupRow | null }).groups)
        .filter((g): g is GroupRow => !!g);
      const counts = await Promise.all(
        rows.map(async (g) => {
          const { count } = await supabase
            .from("media")
            .select("id", { count: "exact", head: true })
            .eq("group_id", g.id);
          return { id: g.id, count: count ?? 0 };
        }),
      );
      const covers = await signPaths(rows.map((g) => g.cover_url));
      return rows.map((g) => ({
        ...g,
        coverUrl: g.cover_url ? covers[g.cover_url] : undefined,
        count: counts.find((c) => c.id === g.id)?.count ?? 0,
      }));
    },
  });

  return (
    <AppShell
      title="Snugg"
      subtitle="Your shared scrapbooks"
      action={
        <Button asChild size="sm" className="press rounded-xl">
          <Link to="/groups">
            <Plus className="size-4" strokeWidth={2} /> Group
          </Link>
        </Button>
      }
    >
      <VaultWidget />
      {groups.isLoading ? (

        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-sand" />
          ))}
        </div>
      ) : groups.data?.length ? (
        <div className="space-y-4">
          {groups.data.map((group, i) => (
            <Link
              key={group.id}
              to="/groups/$groupId"
              params={{ groupId: group.id }}
              style={{ animationDelay: `${i * 45}ms` }}
              className="rise press card-soft block overflow-hidden"
            >
              <div className="relative h-40 bg-sand">
                {group.coverUrl ? (
                  <img
                    src={group.coverUrl}
                    alt={group.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-primary/70">
                    <CalendarHeart className="size-9" strokeWidth={1.4} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <h2 className="text-lg font-semibold">{group.name}</h2>
                  <p className="text-xs text-muted-foreground">code {group.invite_code}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                  <Images className="size-3.5" strokeWidth={1.7} /> {group.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No groups yet"
          body="Start a group for your friends, or join one with an invite code."
          action={
            <Button asChild className="press mt-2 rounded-xl">
              <Link to="/groups">Create or join</Link>
            </Button>
          }
        />
      )}
    </AppShell>
  );
}
