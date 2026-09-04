import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Copy, Crown, LogOut, Share2, Trophy, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { GroupRow, MemberRow } from "@/lib/types";

export function MembersTab({
  group,
  members,
  currentUserId,
  isAdmin,
}: {
  group: GroupRow;
  members: MemberRow[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const inviteLink =
    typeof window === "undefined" ? "" : `${window.location.origin}/join/${group.invite_code}`;

  const remove = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("group_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", group.id] });
      toast.success("Member removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leave = useMutation({
    mutationFn: async () => {
      const mine = members.find((m) => m.user_id === currentUserId);
      if (!mine) return;
      const { error } = await supabase.from("group_members").delete().eq("id", mine.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      navigate({ to: "/home" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="card-soft space-y-3 p-4">
        <h3 className="font-semibold">Invite your people</h3>
        <p className="text-sm text-muted-foreground">
          Code <span className="font-semibold tracking-[0.2em]">{group.invite_code}</span>
        </p>
        <div className="flex items-center gap-3">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(inviteLink)}`}
            alt={`QR code for joining ${group.name}`}
            width={100}
            height={100}
            loading="lazy"
            className="size-24 rounded-xl bg-card p-1"
          />
          <p className="flex-1 text-xs text-muted-foreground">
            Let a friend scan this with their camera to hop straight into {group.name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="press rounded-xl"
            onClick={async () => {
              const share = {
                title: `Join ${group.name} on Snugg`,
                text: `Come add your photos to ${group.name} — code ${group.invite_code}`,
                url: inviteLink,
              };
              if (typeof navigator !== "undefined" && navigator.share) {
                try {
                  await navigator.share(share);
                  return;
                } catch {
                  /* cancelled — fall through to copy */
                }
              }
              await navigator.clipboard.writeText(inviteLink);
              toast.success("Invite link copied");
            }}
          >
            <Share2 className="size-4" strokeWidth={1.8} /> Share invite
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="press rounded-xl"
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              toast.success("Invite link copied");
            }}
          >
            <Copy className="size-4" strokeWidth={1.8} /> Copy link
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="press rounded-xl"
            onClick={() => {
              navigator.clipboard.writeText(group.invite_code);
              toast.success("Code copied");
            }}
          >
            Copy code
          </Button>
        </div>
      </div>


      <div className="card-soft divide-y divide-border">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {(m.profiles?.display_name ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <div className="flex-1">
              <p className="flex items-center gap-1 text-sm font-medium">
                {m.profiles?.display_name ?? "Friend"}
                {m.role === "admin" ? (
                  <Crown className="size-3.5 text-primary" strokeWidth={1.8} />
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                joined {new Date(m.joined_at).toLocaleDateString()}
              </p>
            </div>
            {isAdmin && m.user_id !== currentUserId ? (
              <button
                onClick={() => {
                  const name = m.profiles?.display_name ?? "this member";
                  if (window.confirm(`Remove ${name} from ${group.name}?`)) {
                    remove.mutate(m.id);
                  }
                }}
                className="press rounded-full bg-secondary p-2 text-muted-foreground"
                aria-label="Remove member"
              >
                <UserMinus className="size-4" strokeWidth={1.8} />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <Leaderboard groupId={group.id} />

      <Button
        variant="ghost"
        className="press h-11 w-full rounded-xl text-destructive"
        onClick={() => {
          if (
            window.confirm(
              `Are you sure you want to leave ${group.name}? You will need an invite code or link to rejoin.`,
            )
          ) {
            leave.mutate();
          }
        }}
      >
        <LogOut className="size-4" strokeWidth={1.8} /> Leave this group
      </Button>
    </div>
  );
}

function Leaderboard({ groupId }: { groupId: string }) {
  const board = useQuery({
    queryKey: ["leaderboard", groupId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("group_leaderboard", { _group_id: groupId });
      if (error) throw error;
      return (data ?? []) as {
        user_id: string;
        display_name: string | null;
        uploads: number;
      }[];
    },
  });

  return (
    <div className="card-soft p-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <Trophy className="size-4 text-primary" strokeWidth={1.8} /> Upload leaderboard
      </h3>
      <div className="mt-3 space-y-2">
        {board.data?.map((row, i) => (
          <div key={row.user_id} className="flex items-center gap-3 text-sm">
            <span className="w-5 text-muted-foreground">{i + 1}</span>
            <span className="flex-1">{row.display_name ?? "Friend"}</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
              {row.uploads} uploads
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
