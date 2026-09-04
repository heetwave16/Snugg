import { supabase } from "@/integrations/supabase/client";

/** Registers the service worker (PWA install + notification display). */
export async function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function enablePushNotifications() {
  if (typeof Notification === "undefined") return "unsupported" as const;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
  await registerServiceWorker();
  return "granted" as const;
}

/** Shows a web notification through the service worker (falls back to page-level). */
export async function showLocalNotification(title: string, body: string, url = "/notifications") {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg?.active) {
    reg.active.postMessage({ type: "snugg-notify", title, body, url });
  } else {
    new Notification(title, { body });
  }
}

type NotifyInput = {
  groupId: string;
  mediaId?: string | null;
  type: string;
  body: string;
  userIds: string[];
};

/** Fans out in-app notifications to group mates (skips the actor). */
export async function notifyMembers({ groupId, mediaId, type, body, userIds }: NotifyInput) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  const rows = userIds
    .filter((id) => id && id !== me)
    .map((id) => ({
      user_id: id,
      group_id: groupId,
      media_id: mediaId ?? null,
      actor_id: me ?? null,
      type,
      body,
    }));
  if (!rows.length) return;
  await supabase.from("notifications").insert(rows);
}

export async function groupMemberIds(groupId: string) {
  const { data } = await supabase.from("group_members").select("user_id").eq("group_id", groupId);
  return (data ?? []).map((r) => r.user_id);
}
