import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GroupRow, MediaRow, MemberRow } from "@/lib/types";

export function useGroup(groupId: string) {
  const group = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .maybeSingle();
      if (error) throw error;
      return data as GroupRow | null;
    },
  });

  const members = useQuery({
    queryKey: ["members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("id,user_id,role,joined_at,profiles(id,display_name,avatar_url,email)")
        .eq("group_id", groupId)
        .order("joined_at");
      if (error) throw error;
      return (data ?? []) as unknown as MemberRow[];
    },
  });

  return { group, members };
}

export function useGroupMedia(groupId: string, albumId?: string) {
  return useQuery({
    queryKey: ["media", groupId, albumId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("media")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });
      if (albumId) query = query.eq("album_id", albumId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as MediaRow[];
    },
  });
}
