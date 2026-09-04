/**
 * Daily alert engine — the nudges that pull people back into the vault.
 * Runs client-side once per day per kind (deduped in localStorage) and only
 * ever shows an on-device notification plus an in-app toast.
 */
import { showLocalNotification } from "@/lib/notify";
import { onThisDay, promptOfTheDay, rediscover, uploadStreak, type Engagement } from "@/lib/memories";
import type { MediaRow } from "@/lib/types";

const KEY = "snugg-alerts";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function seen(kind: string) {
  if (typeof localStorage === "undefined") return true;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, string>;
    return raw[kind] === todayKey();
  } catch {
    return false;
  }
}

function mark(kind: string) {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, string>;
    raw[kind] = todayKey();
    localStorage.setItem(KEY, JSON.stringify(raw));
  } catch {
    /* ignore */
  }
}

export type Alert = { kind: string; title: string; body: string; url?: string };

/** Builds today's alerts from the vault, highest-value first. */
export function buildDailyAlerts(
  media: MediaRow[],
  engagement: Engagement = {},
  capsules: { title: string; unlock_at: string }[] = [],
): Alert[] {
  const alerts: Alert[] = [];

  const throwbacks = onThisDay(media);
  if (throwbacks.length) {
    alerts.push({
      kind: "throwback",
      title: "On this day",
      body: `${throwbacks.length} memor${throwbacks.length === 1 ? "y" : "ies"} from this day in another year.`,
    });
  }

  const justUnlocked = capsules.filter((c) => {
    const t = new Date(c.unlock_at).getTime();
    return t <= Date.now() && t > Date.now() - 36 * 3600_000;
  });
  for (const c of justUnlocked) {
    alerts.push({
      kind: `capsule:${c.title}`,
      title: "A time capsule opened",
      body: `“${c.title}” is now unlocked — go look inside.`,
    });
  }

  const { streak, addedToday } = uploadStreak(media);
  if (streak > 0 && !addedToday) {
    alerts.push({
      kind: "streak",
      title: `${streak}-day streak at risk`,
      body: "Add one memory today to keep it alive.",
    });
  }

  const gem = rediscover(media, engagement, 1)[0];
  if (gem) {
    alerts.push({
      kind: "rediscover",
      title: "Remember this?",
      body: "A forgotten favourite resurfaced in your vault.",
    });
  }

  alerts.push({ kind: "prompt", title: "Today's prompt", body: promptOfTheDay() });
  return alerts;
}

/** Fires the first not-yet-seen alert of the day as a device notification. */
export async function runDailyAlerts(alerts: Alert[]) {
  const next = alerts.find((a) => !seen(a.kind));
  if (!next) return null;
  mark(next.kind);
  await showLocalNotification(next.title, next.body, next.url ?? "/home");
  return next;
}
