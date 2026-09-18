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
        <Button asChild size="sm" className="press h-9 rounded-full px-4 text-xs font-semibold">
          <Link to="/groups">
            <Plus className="size-3.5" strokeWidth={2.2} /> New Group
          </Link>
        </Button>
      }
    >
      <VaultWidget />
      {groups.isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl border border-border/40 bg-secondary/50" />
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
              className="rise press group block overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-all hover:border-border"
            >
              <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-secondary via-secondary/70 to-card">
                {group.coverUrl ? (
                  <img
                    src={group.coverUrl}
                    alt={group.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-primary/60">
                    <CalendarHeart className="size-10" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold tracking-tight text-white drop-shadow-sm">
                      {group.name}
                    </h2>
                    <p className="text-[11px] font-mono tracking-widest text-white/80 uppercase">
                      #{group.invite_code}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                    <Images className="size-3.5" strokeWidth={2} /> {group.count}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No groups yet"
          body="Start a group for your friends, or join one with an invite code."
          action={
            <Button asChild className="press mt-2 h-11 rounded-full px-6 text-sm font-semibold">
              <Link to="/groups">Create or join</Link>
            </Button>
          }
        />
      )}
    </AppShell>
  );
}
