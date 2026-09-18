import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { BellRing, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { enablePushNotifications, showLocalNotification } from "@/lib/notify";

type NotificationRow = {
  id: string;
  type: string;
  body: string;
  group_id: string | null;
  read_at: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Snugg" },
      { name: "description", content: "New uploads, tags and comments from your groups." },
      { property: "og:title", content: "Notifications — Snugg" },
      { property: "og:description", content: "New uploads, tags and comments from your groups." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const items = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,body,group_id,read_at,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`my-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (row.user_id === userId) {
            showLocalNotification("Snugg", row.body);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    items.refetch();
  }

  return (
    <AppShell
      title="Notifications"
      subtitle="What your friends have been up to"
      action={
        <Button
          size="sm"
          variant="secondary"
          className="press rounded-xl"
          onClick={async () => {
            const result = await enablePushNotifications();
            toast[result === "granted" ? "success" : "info"](
              result === "granted" ? "Push notifications on" : `Notifications: ${result}`,
            );
          }}
        >
          <BellRing className="size-4" strokeWidth={1.8} /> Enable push
        </Button>
      }
    >
      {items.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : items.data?.length ? (
        <div className="space-y-2">
          <button onClick={markAllRead} className="text-xs text-muted-foreground underline">
            mark all read
          </button>
          {items.data.map((n, i) => (
            <div
              key={n.id}
              style={{ animationDelay: `${i * 30}ms` }}
              className="rise card-soft flex items-start gap-3 p-4"
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                {n.read_at ? (
                  <Check className="size-4" strokeWidth={1.8} />
                ) : (
                  <BellRing className="size-4" strokeWidth={1.8} />
                )}
              </span>
              <div className="flex-1">
                <p className="text-sm">{n.body}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {n.group_id ? (
                <Link
                  to="/groups/$groupId"
                  params={{ groupId: n.group_id }}
                  className="press text-xs text-primary underline"
                >
                  open
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="All quiet" body="You'll hear from us when new photos or tags land." />
      )}
    </AppShell>
  );
}
