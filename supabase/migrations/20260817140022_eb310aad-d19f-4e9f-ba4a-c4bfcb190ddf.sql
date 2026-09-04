
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.group_id_by_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.group_preview_by_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.media_group_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.poll_group_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.poll_option_group_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.capsule_group_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.group_leaderboard(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_group() FROM anon, authenticated;

CREATE POLICY "group members read media files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media' AND public.is_group_member(((storage.foldername(name))[1])::uuid, auth.uid()));

CREATE POLICY "group members upload media files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND public.is_group_member(((storage.foldername(name))[1])::uuid, auth.uid()));

CREATE POLICY "group members update media files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND public.is_group_member(((storage.foldername(name))[1])::uuid, auth.uid()));

CREATE POLICY "group members delete media files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media' AND public.is_group_member(((storage.foldername(name))[1])::uuid, auth.uid()));
