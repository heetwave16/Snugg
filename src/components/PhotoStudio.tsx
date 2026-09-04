import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Camera,
  Check,
  RefreshCw,
  RotateCw,
  Sparkles,
  SwitchCamera,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { suggestCaptions } from "@/lib/ai.functions";
import { cssFor, DEFAULT_EDIT, PRESETS, renderEdited, type EditOptions } from "@/lib/filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/* ------------------------------- camera ---------------------------------- */

export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        setError("We couldn't reach your camera. Check permissions and try again.");
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  function shoot() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `snap-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink text-background">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="press rounded-full bg-background/15 p-2">
          <X className="size-5" strokeWidth={1.8} />
        </button>
        <p className="text-xs opacity-80">Snap a moment</p>
        <button
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          className="press rounded-full bg-background/15 p-2"
          aria-label="Flip camera"
        >
          <SwitchCamera className="size-5" strokeWidth={1.8} />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <p className="max-w-xs px-6 text-center text-sm opacity-85">{error}</p>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className={cn("max-h-full max-w-full", facing === "user" && "-scale-x-100")}
          />
        )}
      </div>
      <div className="flex items-center justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <button
          onClick={shoot}
          disabled={!!error}
          className="press flex size-16 items-center justify-center rounded-full bg-background text-ink disabled:opacity-40"
          aria-label="Take photo"
        >
          <Camera className="size-7" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- editor --------------------------------- */

export function PhotoStudio({
  file,
  onSave,
  onClose,
}: {
  file: File;
  onSave: (edited: File, caption: string) => void;
  onClose: () => void;
}) {
  const [opts, setOpts] = useState<EditOptions>({ ...DEFAULT_EDIT });
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const askAi = useServerFn(suggestCaptions);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = <K extends keyof EditOptions>(key: K, value: EditOptions[K]) =>
    setOpts((o) => ({ ...o, [key]: value }));

  async function suggest() {
    setThinking(true);
    try {
      const small = await downscaleDataUrl(file, 768);
      const res = await askAi({ data: { imageDataUrl: small } });
      if (res.error) toast.error(res.error);
      setIdeas(res.captions);
      if (!res.captions.length && !res.error) toast.info("No ideas this time — write your own!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setThinking(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      const edited = await renderEdited(file, opts);
      onSave(edited, opts.caption.trim());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] text-background">
        <button onClick={onClose} className="press rounded-full bg-background/15 p-2">
          <X className="size-5" strokeWidth={1.8} />
        </button>
        <p className="text-xs opacity-80">Customise</p>
        <button
          onClick={() => set("rotate", ((opts.rotate + 90) % 360) as EditOptions["rotate"])}
          className="press rounded-full bg-background/15 p-2"
          aria-label="Rotate"
        >
          <RotateCw className="size-5" strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        <div
          className={cn(
            "flex max-h-full flex-col items-center overflow-hidden",
            opts.frame && "rounded-sm bg-[#FDFBF7] p-2 pb-6 shadow-xl",
          )}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{ filter: cssFor(opts), transform: `rotate(${opts.rotate}deg)` }}
              className="max-h-[46vh] max-w-full object-contain"
            />
          ) : null}
          {opts.frame && opts.caption ? (
            <span className="mt-2 font-hand text-lg text-ink">{opts.caption}</span>
          ) : null}
        </div>
      </div>

      <div className="max-h-[52vh] space-y-4 overflow-y-auto rounded-t-3xl bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => set("presetId", p.id)}
              className={cn(
                "press shrink-0 rounded-full px-3 py-1.5 text-xs",
                opts.presetId === p.id ? "bg-primary text-primary-foreground" : "bg-secondary",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3">
          <Tune label="Brightness" value={opts.brightness} min={0.6} max={1.4} step={0.02} onChange={(v) => set("brightness", v)} />
          <Tune label="Contrast" value={opts.contrast} min={0.6} max={1.5} step={0.02} onChange={(v) => set("contrast", v)} />
          <Tune label="Colour" value={opts.saturation} min={0} max={2} step={0.05} onChange={(v) => set("saturation", v)} />
          <Tune label="Warmth" value={opts.warmth} min={0} max={1} step={0.05} onChange={(v) => set("warmth", v)} />
          <Tune label="Grain" value={opts.grain} min={0} max={1} step={0.05} onChange={(v) => set("grain", v)} />
          <Tune label="Vignette" value={opts.vignette} min={0} max={1} step={0.05} onChange={(v) => set("vignette", v)} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => set("frame", !opts.frame)}
            className={cn(
              "press rounded-full px-3 py-1.5 text-xs",
              opts.frame ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            Polaroid frame
          </button>
          <button
            onClick={() => setOpts({ ...DEFAULT_EDIT, caption: opts.caption })}
            className="press flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs"
          >
            <RefreshCw className="size-3" strokeWidth={1.8} /> Reset
          </button>
        </div>

        <div className="space-y-2">
          <Input
            value={opts.caption}
            onChange={(e) => set("caption", e.target.value)}
            placeholder="Add a caption…"
            className="rounded-xl"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={suggest}
              disabled={thinking}
              className="press flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs text-accent-foreground"
            >
              <Sparkles className="size-3" strokeWidth={1.8} />
              {thinking ? "Thinking…" : "Caption ideas"}
            </button>
            {ideas.map((idea) => (
              <button
                key={idea}
                onClick={() => set("caption", idea)}
                className="press rounded-full bg-secondary px-3 py-1.5 text-xs"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={busy} className="press h-11 w-full rounded-xl">
          <Check className="size-4" strokeWidth={2} /> {busy ? "Rendering…" : "Use this photo"}
        </Button>
      </div>
    </div>
  );
}

function Tune({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-[11px] text-muted-foreground">
        {label}
        <span>{value.toFixed(2)}</span>
      </span>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </label>
  );
}

/** Shrinks a photo to a data URL small enough for the captioning model. */
export async function downscaleDataUrl(file: File, maxDim = 768) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(url);
  }
}
