import { createServerFn } from "@tanstack/react-start";

type Input = { imageDataUrl: string; vibe?: string };

/**
 * Suggests three short, warm scrapbook captions for a photo.
 * Uses the Lovable AI gateway (vision-capable chat model).
 */
export const suggestCaptions = createServerFn({ method: "POST" })
  .inputValidator((data: Input) => {
    if (!data?.imageDataUrl?.startsWith("data:image/")) throw new Error("Invalid image");
    if (data.imageDataUrl.length > 6_000_000) throw new Error("Image too large for captioning");
    return data;
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { captions: [] as string[], error: "Captioning is not configured" };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "You write captions for a private friend group's photo scrapbook. Reply with exactly 3 captions, one per line, no numbering, no quotes, max 8 words each. Warm, nostalgic, a little playful. Never describe people's appearance or identity.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: data.vibe ? `Vibe: ${data.vibe}. Caption this photo.` : "Caption this photo.",
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const message =
        res.status === 429
          ? "Caption ideas are busy right now — try again in a moment."
          : res.status === 402
            ? "AI credits are used up for this workspace."
            : `Caption ideas unavailable (${res.status}).`;
      return { captions: [] as string[], error: message };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    const captions = text
      .split("\n")
      .map((l) => l.replace(/^[\s\-*\d.]+/, "").replace(/^["']|["']$/g, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    return { captions, error: null as string | null };
  });
