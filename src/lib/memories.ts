/**
 * "Memory vault" algorithms — the hooks that pull people back into Snugg:
 * on-this-day resurfacing, a forgotten-gem rediscovery score, upload streaks,
 * weekly highlight ranking, and a daily shared prompt.
 * All pure functions so they can run on any list of media rows.
 */
import type { MediaRow } from "@/lib/types";

export type Engagement = Record<string, { reactions: number; comments: number; tags: number }>;

const DAY = 86_400_000;

export function isUnlocked(m: MediaRow) {
  return !m.locked_until || new Date(m.locked_until) <= new Date();
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Stable pseudo-random 0..1 from a string — same answer all day, new one tomorrow. */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export function ageDays(m: MediaRow) {
  return Math.floor((Date.now() - new Date(m.created_at).getTime()) / DAY);
}

/** Photos taken on today's calendar day in an earlier year, newest first. */
export function onThisDay(media: MediaRow[], now = new Date()) {
  return media
    .filter(isUnlocked)
    .filter((m) => {
      const d = new Date(m.created_at);
      return (
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate() &&
        d.getFullYear() < now.getFullYear()
      );
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Round-number anniversaries: exactly 1/3/6/12/24 months ago today. */
export function anniversaries(media: MediaRow[], now = new Date()) {
  const months = [1, 3, 6, 12, 24];
  const out: { months: number; items: MediaRow[] }[] = [];
  for (const m of months) {
    const target = new Date(now);
    target.setMonth(target.getMonth() - m);
    const items = media.filter(isUnlocked).filter((x) => {
      const d = new Date(x.created_at);
      return dayKey(d) === dayKey(target);
    });
    if (items.length) out.push({ months: m, items });
  }
  return out;
}

/**
 * Rediscovery score — surfaces warm-but-forgotten memories.
 * Loved photos age into gems; brand-new ones are excluded because the feed
 * already shows them. A daily seed keeps the pick fresh without repeating.
 */
export function rediscoverScore(m: MediaRow, e: Engagement, seedSalt = dayKey(new Date())) {
  const age = ageDays(m);
  if (age < 14) return -1;
  const stats = e[m.id] ?? { reactions: 0, comments: 0, tags: 0 };
  const love = stats.reactions * 3 + stats.comments * 4 + stats.tags * 2;
  const nostalgia = Math.log1p(age) * 6;
  const quiet = love === 0 ? 4 : 0; // give never-seen photos a chance too
  const jitter = seeded(`${m.id}:${seedSalt}`) * 8;
  return love + nostalgia + quiet + jitter;
}

export function rediscover(media: MediaRow[], e: Engagement, count = 6) {
  return media
    .filter(isUnlocked)
    .map((m) => ({ m, score: rediscoverScore(m, e) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.m);
}

/** Top memories of the last `days` days by engagement, for a weekly recap. */
export function highlights(media: MediaRow[], e: Engagement, days = 7, count = 6) {
  const cutoff = Date.now() - days * DAY;
  return media
    .filter(isUnlocked)
    .filter((m) => new Date(m.created_at).getTime() >= cutoff)
    .map((m) => {
      const s = e[m.id] ?? { reactions: 0, comments: 0, tags: 0 };
      return { m, score: s.reactions * 3 + s.comments * 4 + s.tags * 2 };
    })
    .sort((a, b) => b.score - a.score || b.m.created_at.localeCompare(a.m.created_at))
    .slice(0, count)
    .map((x) => x.m);
}

/** Consecutive days (ending today or yesterday) with at least one memory added. */
export function uploadStreak(media: MediaRow[], userId?: string) {
  const days = new Set(
    media
      .filter((m) => (userId ? m.uploader_id === userId : true))
      .map((m) => dayKey(new Date(m.created_at))),
  );
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setTime(cursor.getTime() - DAY);
  if (!days.has(dayKey(cursor))) return { streak: 0, addedToday: days.has(dayKey(new Date())) };
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setTime(cursor.getTime() - DAY);
  }
  return { streak, addedToday: days.has(dayKey(new Date())) };
}

export const PROMPTS = [
  "Post the last photo you took today — no filter, no excuses.",
  "Drop a picture that smells like summer.",
  "Share a photo of your view right now.",
  "Add the most chaotic photo on your camera roll.",
  "Something you ate this week that was worth it.",
  "A photo of someone in this group being ridiculous.",
  "Your favourite corner of your room.",
  "The oldest photo of us you can find.",
  "A screenshot that made you laugh.",
  "Something small that made today better.",
  "A photo of the sky today.",
  "Post the outfit you almost wore.",
  "A memory you never posted anywhere.",
  "Something you're weirdly proud of.",
];

/** Same prompt for everyone in the group each day. */
export function promptOfTheDay(groupId = "snugg", now = new Date()) {
  const idx = Math.floor(seeded(`${groupId}:${dayKey(now)}`) * PROMPTS.length);
  return PROMPTS[Math.min(idx, PROMPTS.length - 1)]!;
}

export function vaultStats(media: MediaRow[]) {
  const unlocked = media.filter(isUnlocked);
  const byMonth = new Map<string, number>();
  for (const m of unlocked) {
    const d = new Date(m.created_at);
    const key = d.toLocaleString(undefined, { month: "long", year: "numeric" });
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  const busiest = [...byMonth.entries()].sort((a, b) => b[1] - a[1])[0];
  const oldest = unlocked.reduce<MediaRow | null>(
    (acc, m) => (!acc || m.created_at < acc.created_at ? m : acc),
    null,
  );
  return {
    total: unlocked.length,
    videos: unlocked.filter((m) => m.kind === "video").length,
    locked: media.length - unlocked.length,
    busiestMonth: busiest ? { label: busiest[0], count: busiest[1] } : null,
    vaultAgeDays: oldest ? ageDays(oldest) : 0,
  };
}

export function relativeLabel(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = (days / 365).toFixed(days % 365 > 180 ? 1 : 0);
  return `${years} year${years === "1" ? "" : "s"} ago`;
}
