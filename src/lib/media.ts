import { supabase } from "@/integrations/supabase/client";

export const MAX_UPLOAD_BYTES = 1024 * 1024; // 1MB target for images
const MAX_DIMENSION = 1920;
const THUMB_DIMENSION = 480;

function drawToCanvas(
  source: HTMLImageElement | HTMLVideoElement,
  srcW: number,
  srcH: number,
  maxDim: number,
) {
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(srcW * scale));
  canvas.height = Math.max(1, Math.round(srcH * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      quality,
    ),
  );
}

async function loadImageElement(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/** Compresses an image below 1MB (JPEG), returning the blob + final dimensions. */
export async function compressImage(file: File) {
  const img = await loadImageElement(file);
  let canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight, MAX_DIMENSION);
  let quality = 0.82;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > MAX_UPLOAD_BYTES && quality > 0.4) {
    quality -= 0.12;
    blob = await canvasToBlob(canvas, quality);
  }
  let dim = MAX_DIMENSION;
  while (blob.size > MAX_UPLOAD_BYTES && dim > 640) {
    dim = Math.round(dim * 0.75);
    canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight, dim);
    blob = await canvasToBlob(canvas, 0.72);
  }

  const thumbCanvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight, THUMB_DIMENSION);
  const thumb = await canvasToBlob(thumbCanvas, 0.7);
  return { blob, thumb, width: canvas.width, height: canvas.height };
}

/** Grabs a poster frame from a video file and makes a small JPEG thumbnail. */
export async function videoThumbnail(file: File) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Could not read video"));
    });
    video.currentTime = Math.min(0.6, (video.duration || 1) / 3);
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      setTimeout(resolve, 1200);
    });
    const canvas = drawToCanvas(video, video.videoWidth, video.videoHeight, THUMB_DIMENSION);
    const thumb = await canvasToBlob(canvas, 0.7);
    return { thumb, width: video.videoWidth, height: video.videoHeight };
  } catch {
    return { thumb: null, width: null, height: null };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const SUPABASE_URL = (import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"]) as string;
const SUPABASE_KEY = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"]) as string;

async function uploadBlob(path: string, blob: Blob, onProgress?: (pct: number) => void) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You need to be signed in to upload");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/media/${path}`);
    if (SUPABASE_KEY) {
      xhr.setRequestHeader("apikey", SUPABASE_KEY);
    }
    xhr.setRequestHeader("authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("content-type", blob.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(blob);
  });
  return path;
}

export type UploadResult = {
  storage_path: string;
  thumb_path: string | null;
  kind: "image" | "video";
  width: number | null;
  height: number | null;
  size_bytes: number;
};

export async function processAndUpload(
  groupId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const id = crypto.randomUUID();
  const isVideo = file.type.startsWith("video/");

  if (isVideo) {
    const { thumb, width, height } = await videoThumbnail(file);
    let thumbPath: string | null = null;
    if (thumb) thumbPath = await uploadBlob(`${groupId}/${id}-thumb.jpg`, thumb);
    const ext = file.name.split(".").pop() || "mp4";
    const path = await uploadBlob(`${groupId}/${id}.${ext}`, file, (p) => onProgress?.(p * 0.98));
    onProgress?.(1);
    return {
      storage_path: path,
      thumb_path: thumbPath,
      kind: "video",
      width,
      height,
      size_bytes: file.size,
    };
  }

  onProgress?.(0.05);
  const { blob, thumb, width, height } = await compressImage(file);
  const thumbPath = await uploadBlob(`${groupId}/${id}-thumb.jpg`, thumb);
  const path = await uploadBlob(`${groupId}/${id}.jpg`, blob, (p) =>
    onProgress?.(0.2 + p * 0.78),
  );
  onProgress?.(1);
  return {
    storage_path: path,
    thumb_path: thumbPath,
    kind: "image",
    width,
    height,
    size_bytes: blob.size,
  };
}

const urlCache = new Map<string, { url: string; expires: number }>();

/** Signs storage paths for private-bucket viewing, with a small in-memory cache. */
export async function signPaths(paths: (string | null | undefined)[]) {
  const wanted = Array.from(new Set(paths.filter((p): p is string => !!p)));
  const now = Date.now();
  const missing = wanted.filter((p) => {
    const hit = urlCache.get(p);
    return !hit || hit.expires < now;
  });
  if (missing.length) {
    const { data } = await supabase.storage.from("media").createSignedUrls(missing, 3600);
    for (const row of data ?? []) {
      if (row.signedUrl && row.path) {
        urlCache.set(row.path, { url: row.signedUrl, expires: now + 55 * 60 * 1000 });
      }
    }
  }
  const out: Record<string, string> = {};
  for (const p of wanted) {
    const hit = urlCache.get(p);
    if (hit) out[p] = hit.url;
  }
  return out;
}

export async function downloadZip(
  items: { path: string; name: string }[],
  zipName = "snugg-photos.zip",
) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const urls = await signPaths(items.map((i) => i.path));
  for (const item of items) {
    const url = urls[item.path];
    if (!url) continue;
    const res = await fetch(url);
    zip.file(item.name, await res.blob());
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = zipName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 5000);
}
