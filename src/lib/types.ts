export type MediaRow = {
  id: string;
  group_id: string;
  album_id: string | null;
  uploader_id: string;
  kind: "image" | "video";
  storage_path: string;
  thumb_path: string | null;
  width: number | null;
  height: number | null;
  caption: string | null;
  locked_until: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

export type MemberRow = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: Profile | null;
};

export type AlbumRow = {
  id: string;
  group_id: string;
  title: string;
  event_date: string | null;
  created_at: string;
  created_by: string;
};

export type GroupRow = {
  id: string;
  name: string;
  cover_url: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export const REACTION_EMOJIS = ["❤️", "😂", "😍", "🔥", "🥹", "🙌"] as const;
