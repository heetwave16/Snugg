/**
 * Client-side photo customisation: nostalgic filter presets, manual tuning,
 * grain / vignette / polaroid frame, and burned-in handwriting captions.
 * Everything renders on a canvas so the uploaded file is already styled.
 */

export type Preset = {
  id: string;
  label: string;
  /** Base CSS filter string applied to the canvas draw. */
  css: string;
};

export const PRESETS: Preset[] = [
  { id: "original", label: "Original", css: "none" },
  {
    id: "kodak",
    label: "Kodak 400",
    css: "saturate(1.18) contrast(1.08) sepia(0.1) brightness(1.03)",
  },
  { id: "faded", label: "Faded", css: "saturate(0.8) contrast(0.92) brightness(1.08) sepia(0.08)" },
  { id: "sunbleach", label: "Sunbleach", css: "saturate(1.3) brightness(1.12) sepia(0.18)" },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.12)" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.35) brightness(0.92)" },
  { id: "cool", label: "Cool film", css: "saturate(1.05) hue-rotate(-8deg) contrast(1.06)" },
  { id: "dream", label: "Dreamy", css: "saturate(1.1) brightness(1.06) blur(0.4px)" },
  { id: "vhs", label: "VHS", css: "saturate(1.45) contrast(0.95) hue-rotate(6deg) brightness(1.04)" },
];

export type EditOptions = {
  presetId: string;
  brightness: number; // 0.6 - 1.4
  contrast: number; // 0.6 - 1.4
  saturation: number; // 0 - 2
  warmth: number; // 0 - 1 sepia mix
  grain: number; // 0 - 1
  vignette: number; // 0 - 1
  frame: boolean;
  caption: string;
  rotate: number; // 0 | 90 | 180 | 270
};

export const DEFAULT_EDIT: EditOptions = {
  presetId: "original",
  brightness: 1,
  contrast: 1,
  saturation: 1,
  warmth: 0,
  grain: 0,
  vignette: 0,
  frame: false,
  caption: "",
  rotate: 0,
};

export function cssFor(opts: EditOptions) {
  const preset = PRESETS.find((p) => p.id === opts.presetId);
  const base = preset && preset.css !== "none" ? `${preset.css} ` : "";
  return `${base}brightness(${opts.brightness}) contrast(${opts.contrast}) saturate(${opts.saturation}) sepia(${opts.warmth * 0.35})`.trim();
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(img);
    };
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = url;
  });
}

function addGrain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  if (amount <= 0) return;
  const strength = amount * 42;
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const noise = (Math.random() - 0.5) * strength;
    px[i] = Math.max(0, Math.min(255, (px[i] ?? 0) + noise));
    px[i + 1] = Math.max(0, Math.min(255, (px[i + 1] ?? 0) + noise));
    px[i + 2] = Math.max(0, Math.min(255, (px[i + 2] ?? 0) + noise));
  }
  ctx.putImageData(data, 0, 0);
}

function addVignette(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  if (amount <= 0) return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(28,20,14,${0.65 * amount})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

const MAX_DIM = 1920;

/** Renders the edited photo into a fresh JPEG File ready for upload. */
export async function renderEdited(file: File, opts: EditOptions): Promise<File> {
  const img = await loadImage(file);
  const swap = opts.rotate === 90 || opts.rotate === 270;
  const srcW = swap ? img.naturalHeight : img.naturalWidth;
  const srcH = swap ? img.naturalWidth : img.naturalHeight;
  const scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const pad = opts.frame ? Math.round(Math.max(w, h) * 0.045) : 0;
  const bottom = opts.frame ? pad * (opts.caption ? 4.2 : 2.6) : 0;

  const canvas = document.createElement("canvas");
  canvas.width = w + pad * 2;
  canvas.height = h + pad + bottom;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  if (opts.frame) {
    ctx.fillStyle = "#FDFBF7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.filter = cssFor(opts);
  ctx.translate(pad, pad);
  if (opts.rotate) {
    ctx.translate(w / 2, h / 2);
    ctx.rotate((opts.rotate * Math.PI) / 180);
    ctx.translate(-(swap ? h : w) / 2, -(swap ? w : h) / 2);
    ctx.drawImage(img, 0, 0, swap ? h : w, swap ? w : h);
  } else {
    ctx.drawImage(img, 0, 0, w, h);
  }
  ctx.restore();

  // effects are applied to the photo area only
  const region = ctx.getImageData(pad, pad, w, h);
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext("2d");
  if (tctx) {
    tctx.putImageData(region, 0, 0);
    addGrain(tctx, w, h, opts.grain);
    addVignette(tctx, w, h, opts.vignette);
    ctx.drawImage(tmp, pad, pad);
  }

  if (opts.frame && opts.caption.trim()) {
    ctx.fillStyle = "#2B2622";
    const size = Math.max(16, Math.round(canvas.width * 0.042));
    ctx.font = `${size}px "Caveat", "Segoe Script", cursive`;
    ctx.textAlign = "center";
    ctx.fillText(opts.caption.trim().slice(0, 60), canvas.width / 2, h + pad + bottom * 0.62);
  }

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode"))), "image/jpeg", 0.9),
  );
  const name = file.name.replace(/\.[^.]+$/, "") || "snugg";
  return new File([blob], `${name}-snugg.jpg`, { type: "image/jpeg" });
}
