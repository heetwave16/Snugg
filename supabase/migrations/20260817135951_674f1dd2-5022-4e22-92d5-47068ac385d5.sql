
-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  display_name text,
  avatar_url text,
  consented_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- GROUPS
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cover_url text,
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,7)),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  consented boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id);
$$;
CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id AND role = 'admin');
$$;
CREATE OR REPLACE FUNCTION public.group_id_by_code(_code text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.groups WHERE invite_code = upper(_code);
$$;
CREATE OR REPLACE FUNCTION public.group_preview_by_code(_code text)
RETURNS TABLE (id uuid, name text, cover_url text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.name, g.cover_url FROM public.groups g WHERE g.invite_code = upper(_code);
$$;

-- profiles policies (group-mates visible)
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "groupmate profiles" ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_members a JOIN public.group_members b ON a.group_id = b.group_id
          WHERE a.user_id = auth.uid() AND b.user_id = public.profiles.id)
);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "delete own profile" ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid());

-- groups policies
CREATE POLICY "members read groups" ON public.groups FOR SELECT TO authenticated USING (public.is_group_member(id, auth.uid()));
CREATE POLICY "create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "admins update groups" ON public.groups FOR UPDATE TO authenticated USING (public.is_group_admin(id, auth.uid()));
CREATE POLICY "admins delete groups" ON public.groups FOR DELETE TO authenticated USING (public.is_group_admin(id, auth.uid()));

-- group_members policies
CREATE POLICY "read members of my groups" ON public.group_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_group_member(group_id, auth.uid()));
CREATE POLICY "join groups myself" ON public.group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own membership" ON public.group_members FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "leave or admin remove" ON public.group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

-- ALBUMS
CREATE TABLE public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_date date,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.albums TO authenticated;
GRANT ALL ON public.albums TO service_role;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read albums" ON public.albums FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "members create albums" ON public.albums FOR INSERT TO authenticated WITH CHECK (public.is_group_member(group_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "owner or admin update albums" ON public.albums FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "owner or admin delete albums" ON public.albums FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

-- MEDIA
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  album_id uuid REFERENCES public.albums(id) ON DELETE SET NULL,
  uploader_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'image' CHECK (kind IN ('image','video')),
  storage_path text NOT NULL,
  thumb_path text,
  width int,
  height int,
  size_bytes bigint,
  caption text,
  locked_until timestamptz,
  taken_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_group_created_idx ON public.media (group_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read unlocked media" ON public.media FOR SELECT TO authenticated USING (
  public.is_group_member(group_id, auth.uid())
  AND (locked_until IS NULL OR locked_until <= now() OR uploader_id = auth.uid())
);
CREATE POLICY "members upload media" ON public.media FOR INSERT TO authenticated WITH CHECK (public.is_group_member(group_id, auth.uid()) AND uploader_id = auth.uid());
CREATE POLICY "owner or admin update media" ON public.media FOR UPDATE TO authenticated USING (uploader_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "owner or admin delete media" ON public.media FOR DELETE TO authenticated USING (uploader_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.media_group_id(_media_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT group_id FROM public.media WHERE id = _media_id;
$$;

-- REACTIONS
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read reactions" ON public.reactions FOR SELECT TO authenticated USING (public.is_group_member(public.media_group_id(media_id), auth.uid()));
CREATE POLICY "members react" ON public.reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_group_member(public.media_group_id(media_id), auth.uid()));
CREATE POLICY "update own reaction" ON public.reactions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "delete own reaction" ON public.reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- COMMENTS
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read comments" ON public.comments FOR SELECT TO authenticated USING (public.is_group_member(public.media_group_id(media_id), auth.uid()));
CREATE POLICY "members comment" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_group_member(public.media_group_id(media_id), auth.uid()));
CREATE POLICY "update own comment" ON public.comments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "delete own comment or admin" ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_group_admin(public.media_group_id(media_id), auth.uid()));

-- TAGS
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  tagged_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tagged_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_id, tagged_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read tags" ON public.tags FOR SELECT TO authenticated USING (public.is_group_member(public.media_group_id(media_id), auth.uid()));
CREATE POLICY "members tag" ON public.tags FOR INSERT TO authenticated WITH CHECK (tagged_by = auth.uid() AND public.is_group_member(public.media_group_id(media_id), auth.uid()));
CREATE POLICY "untag self or tagger or admin" ON public.tags FOR DELETE TO authenticated
  USING (tagged_user_id = auth.uid() OR tagged_by = auth.uid() OR public.is_group_admin(public.media_group_id(media_id), auth.uid()));

-- POLLS
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  question text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  closes_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT ALL ON public.polls TO service_role;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read polls" ON public.polls FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "members create polls" ON public.polls FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "owner or admin delete polls" ON public.polls FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.poll_group_id(_poll_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT group_id FROM public.polls WHERE id = _poll_id;
$$;

CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  media_id uuid REFERENCES public.media(id) ON DELETE CASCADE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_options TO authenticated;
GRANT ALL ON public.poll_options TO service_role;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read poll options" ON public.poll_options FOR SELECT TO authenticated USING (public.is_group_member(public.poll_group_id(poll_id), auth.uid()));
CREATE POLICY "members add poll options" ON public.poll_options FOR INSERT TO authenticated WITH CHECK (public.is_group_member(public.poll_group_id(poll_id), auth.uid()));
CREATE POLICY "delete poll options" ON public.poll_options FOR DELETE TO authenticated USING (public.is_group_admin(public.poll_group_id(poll_id), auth.uid()));

CREATE OR REPLACE FUNCTION public.poll_option_group_id(_option_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.group_id FROM public.poll_options o JOIN public.polls p ON p.id = o.poll_id WHERE o.id = _option_id;
$$;

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_votes TO authenticated;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read votes" ON public.poll_votes FOR SELECT TO authenticated USING (public.is_group_member(public.poll_group_id(poll_id), auth.uid()));
CREATE POLICY "members vote" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_group_member(public.poll_group_id(poll_id), auth.uid()));
CREATE POLICY "change own vote" ON public.poll_votes FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "delete own vote" ON public.poll_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- TIME CAPSULES
CREATE TABLE public.time_capsules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  unlock_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_capsules TO authenticated;
GRANT ALL ON public.time_capsules TO service_role;
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read capsules" ON public.time_capsules FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "members create capsules" ON public.time_capsules FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "owner or admin delete capsules" ON public.time_capsules FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.capsule_group_id(_capsule_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT group_id FROM public.time_capsules WHERE id = _capsule_id;
$$;

CREATE TABLE public.time_capsule_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capsule_id uuid NOT NULL REFERENCES public.time_capsules(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (capsule_id, media_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_capsule_media TO authenticated;
GRANT ALL ON public.time_capsule_media TO service_role;
ALTER TABLE public.time_capsule_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read capsule media" ON public.time_capsule_media FOR SELECT TO authenticated USING (public.is_group_member(public.capsule_group_id(capsule_id), auth.uid()));
CREATE POLICY "members add capsule media" ON public.time_capsule_media FOR INSERT TO authenticated WITH CHECK (public.is_group_member(public.capsule_group_id(capsule_id), auth.uid()));
CREATE POLICY "delete capsule media" ON public.time_capsule_media FOR DELETE TO authenticated USING (public.is_group_admin(public.capsule_group_id(capsule_id), auth.uid()));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  media_id uuid REFERENCES public.media(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "create notifications for groupmates" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()) AND public.is_group_member(group_id, user_id));
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- creator becomes admin automatically
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role, consented)
  VALUES (NEW.id, NEW.created_by, 'admin', true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_group_created AFTER INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();

-- leaderboard
CREATE OR REPLACE FUNCTION public.group_leaderboard(_group_id uuid)
RETURNS TABLE (user_id uuid, display_name text, avatar_url text, uploads bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, count(m.id)
  FROM public.group_members gm
  JOIN public.profiles p ON p.id = gm.user_id
  LEFT JOIN public.media m ON m.uploader_id = gm.user_id AND m.group_id = _group_id
  WHERE gm.group_id = _group_id AND public.is_group_member(_group_id, auth.uid())
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY count(m.id) DESC;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.media;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
