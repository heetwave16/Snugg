import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarClock, Flame, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signPaths } from "@/lib/media";
import { buildDailyAlerts, runDailyAlerts } from "@/lib/alerts";
import {
  highlights,
  onThisDay,
  promptOfTheDay,
  rediscover,
  relativeLabel,
  uploadStreak,
  vaultStats,
  type Engagement,
} from "@/lib/memories";
import type { MediaRow } from "@/lib/types";

/** Home widget: the resurfacing hooks — on this day, streak, prompt, rediscovery. */
export function VaultWidget() {
  const vault = useQuery({
    queryKey: ["vault"],
    queryFn: async () => {
      const [{ data: media }, { data: reactions }, { data: comments }, { data: tags }, { data: capsules }] =
        await Promise.all([
          supabase.from("media").select("*").order("created_at", { ascending: false }).limit(500),
          supabase.from("reactions").select("media_id"),
          supabase.from("comments").select("media_id"),
          supabase.from("tags").select("media_id"),
          supabase.from("time_capsules").select("title,unlock_at"),
        ]);
      const engagement: Engagement = {};
      const bump = (id: string, key: keyof Engagement[string]) => {
        engagement[id] ??= { reactions: 0, comments: 0, tags: 0 };
        engagement[id]![key] += 1;
      };
      (reactions ?? []).forEach((r) => bump(r.media_id, "reactions"));
      (comments ?? []).forEach((c) => bump(c.media_id, "comments"));
      (tags ?? []).forEach((t) => bump(t.media_id, "tags"));
      const rows = (media ?? []) as MediaRow[];
      const throwbacks = onThisDay(rows).slice(0, 6);
      const gems = rediscover(rows, engagement, 4);
      const week = highlights(rows, engagement, 7, 4);
      const paths = [...throwbacks, ...gems, ...week].map((m) => m.thumb_path ?? m.storage_path);
      const urls = await signPaths(paths);
      return {
        rows,
        engagement,
        throwbacks,
        gems,
        week,
        urls,
        capsules: capsules ?? [],
        stats: vaultStats(rows),
        streak: uploadStreak(rows),
      };
    },
  });

  const [alerted, setAlerted] = useState(false);
  useEffect(() => {
    if (!vault.data || alerted) return;
    setAlerted(true);
    const alerts = buildDailyAlerts(vault.data.rows, vault.data.engagement, vault.data.capsules);
    runDailyAlerts(alerts).then((fired) => {
      if (fired) toast(fired.title, { description: fired.body });
    });
  }, [vault.data, alerted]);

  if (vault.isLoading) return <div className="mb-4 h-32 animate-pulse rounded-2xl bg-sand" />;
  const d = vault.data;
  if (!d || !d.rows.length) return null;

  const src = (m: MediaRow) => d.urls[m.thumb_path ?? m.storage_path];

  return (
    <div className="mb-5 space-y-3">
      <div className="card-soft space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4 text-primary" strokeWidth={1.8} /> Your vault
          </h2>
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs">
            <Flame className="size-3.5 text-primary" strokeWidth={1.9} /> {d.streak.streak}-day streak
          </span>
        </div>
        <p className="font-hand text-xl leading-tight text-foreground">{promptOfTheDay()}</p>
        <p className="text-xs text-muted-foreground">
          {d.stats.total} memories · {d.stats.videos} videos · {d.stats.locked} still locked
          {d.stats.busiestMonth ? ` · busiest ${d.stats.busiestMonth.label}` : ""}
        </p>
      </div>

      {d.throwbacks.length ? (
        <Strip
          icon={<CalendarClock className="size-4 text-primary" strokeWidth={1.8} />}
          title="On this day"
          items={d.throwbacks}
          src={src}
        />
      ) : null}
      {d.gems.length ? (
        <Strip
          icon={<Wand2 className="size-4 text-primary" strokeWidth={1.8} />}
          title="Rediscovered"
          items={d.gems}
          src={src}
        />
      ) : null}
      {d.week.length ? (
        <Strip
          icon={<Sparkles className="size-4 text-primary" strokeWidth={1.8} />}
          title="This week's highlights"
          items={d.week}
          src={src}
        />
      ) : null}
    </div>
  );
}

function Strip({
  icon,
  title,
  items,
  src,
}: {
  icon: React.ReactNode;
  title: string;
  items: MediaRow[];
  src: (m: MediaRow) => string | undefined;
}) {
  return (
    <div className="card-soft p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {icon} {title}
      </h3>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {items.map((m) => (
          <div key={m.id} className="w-28 shrink-0">
            <div className="h-28 overflow-hidden rounded-xl bg-sand">
              {src(m) ? (
                <img src={src(m)} alt={m.caption ?? title} loading="lazy" className="size-full object-cover" />
              ) : null}
            </div>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              {relativeLabel(m.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
