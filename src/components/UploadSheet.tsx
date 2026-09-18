import { useRef, useState } from "react";
import { Camera, ImagePlus, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { processAndUpload } from "@/lib/media";
import { groupMemberIds, notifyMembers } from "@/lib/notify";
import { CameraCapture, PhotoStudio } from "@/components/PhotoStudio";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Props = {
  groupId: string;
  albumId?: string | null;
  lockedUntil?: string | null;
  onUploaded?: (ids: string[]) => void;
};

type Item = { id: string; file: File; caption: string; edited: boolean };

export function UploadSheet({ groupId, albumId, lockedUntil, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const add = (files: File[]) =>
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${file.name}-${crypto.randomUUID()}`,
        file,
        caption: "",
        edited: false,
      })),
    ]);

  async function start() {
    if (!items.length) return;
    setBusy(true);
    const created: string[] = [];
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      toast.error("Please sign in again");
      setBusy(false);
      return;
    }

    const CONCURRENCY = 3;
    let nextIndex = 0;
    async function worker() {
      while (nextIndex < items.length) {
        const item = items[nextIndex++];
        if (!item) break;
        try {
          const result = await processAndUpload(groupId, item.file, (pct) =>
            setProgress((p) => ({ ...p, [item.id]: pct })),
          );
          const { data, error } = await supabase
            .from("media")
            .insert({
              group_id: groupId,
              album_id: albumId ?? null,
              uploader_id: me,
              locked_until: lockedUntil ?? null,
              caption: item.caption.trim() || null,
              ...result,
            })
            .select("id")
            .single();
          if (error) throw error;
          created.push(data.id);
        } catch (err) {
          toast.error(`${item.file.name}: ${(err as Error).message}`);
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker()),
    );

    if (created.length) {
      await notifyMembers({
        groupId,
        type: "upload",
        body: `${created.length} new ${created.length === 1 ? "memory" : "memories"} added`,
        userIds: await groupMemberIds(groupId),
      });
      toast.success(`${created.length} uploaded`);
    }
    setItems([]);
    setProgress({});
    setBusy(false);
    onUploaded?.(created);
  }

  const total = items.length
    ? Object.values(progress).reduce((a, b) => a + b, 0) / items.length
    : 0;
  const editItem = items.find((i) => i.id === editing);

  return (
    <div className="card-soft border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          add(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) {
            add(files);
            toast.success("Photo captured! Tap Customise to edit or add captions.");
          }
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => inputRef.current?.click()}
          className="press flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-secondary/40 px-4 py-5 text-center transition-colors hover:bg-secondary/70"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ImagePlus className="size-5" strokeWidth={2} />
          </div>
          <span className="text-xs font-semibold text-foreground">Choose Photos</span>
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="press flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-secondary/40 px-4 py-5 text-center transition-colors hover:bg-secondary/70"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Camera className="size-5" strokeWidth={2} />
          </div>
          <span className="text-xs font-semibold text-foreground">Open Camera</span>
        </button>
      </div>
      <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
        Auto-compressed under 1MB. Tap Customise on any photo to add filters.
      </p>

      {items.length ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{items.length} selected</p>
            {!busy ? (
              <button
                onClick={() => setItems([])}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <X className="size-3" /> clear
              </button>
            ) : null}
          </div>
          <Progress value={Math.round(total * 100)} className="h-2" />
          <div className="max-h-52 space-y-2 overflow-y-auto">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-2 rounded-xl bg-secondary/60 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{it.file.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {Math.round((progress[it.id] ?? 0) * 100)}%
                    {it.edited ? " · edited" : ""}
                    {it.caption ? ` · “${it.caption}”` : ""}
                  </p>
                </div>
                {!busy && it.file.type.startsWith("image/") ? (
                  <button
                    onClick={() => setEditing(it.id)}
                    className="press flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[11px]"
                  >
                    <Wand2 className="size-3" strokeWidth={1.8} /> Customise
                  </button>
                ) : null}
                {!busy ? (
                  <button
                    onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                    className="press rounded-full bg-card p-1.5"
                    aria-label="Remove"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <Button onClick={start} disabled={busy} className="press h-11 w-full rounded-xl">
            {busy ? "Uploading…" : "Upload to Snugg"}
          </Button>
        </div>
      ) : null}

      {camera ? (
        <CameraCapture
          onClose={() => setCamera(false)}
          onCapture={(file) => {
            add([file]);
            setCamera(false);
            toast.success("Snapped! Tap Customise to add a filter.");
          }}
        />
      ) : null}

      {editItem ? (
        <PhotoStudio
          file={editItem.file}
          onClose={() => setEditing(null)}
          onSave={(edited, caption) => {
            setItems((p) =>
              p.map((x) => (x.id === editItem.id ? { ...x, file: edited, caption, edited: true } : x)),
            );
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}
