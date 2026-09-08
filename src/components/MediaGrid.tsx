import { useQuery } from "@tanstack/react-query";
import { Check, Lock, Play } from "lucide-react";
import { signPaths } from "@/lib/media";
import type { MediaRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function useMediaUrls(items: MediaRow[], useThumb = true) {
  const paths = items.map((m) => (useThumb ? m.thumb_path || m.storage_path : m.storage_path));
  return useQuery({
    queryKey: ["signed", useThumb, paths],
    queryFn: () => signPaths(paths),
    enabled: paths.length > 0,
    staleTime: 50 * 60 * 1000,
  });
}

export function MediaGrid({
  items,
  onOpen,
  selecting = false,
  selected = new Set<string>(),
  onToggle,
}: {
  items: MediaRow[];
  onOpen: (index: number) => void;
  selecting?: boolean;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
}) {
  const { data: urls } = useMediaUrls(items);

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {items.map((item, index) => {
        const key = item.thumb_path || item.storage_path;
        const url = urls?.[key];
        const isSelected = selected.has(item.id);
        const locked = !!item.locked_until && new Date(item.locked_until) > new Date();
        return (
          <button
            key={item.id}
            onClick={() => (selecting ? onToggle?.(item.id) : onOpen(index))}
            style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
            className="rise press relative aspect-square overflow-hidden rounded-xl bg-secondary shadow-soft"
          >
            {url ? (
              <img
                src={url}
                alt={item.caption ?? "Shared memory"}
                loading="lazy"
                className={cn(
                  "size-full object-cover transition-transform duration-500",
                  locked && "blur-md brightness-95",
                )}
              />
            ) : (
              <span className="block size-full animate-pulse bg-muted" />
            )}
            {item.kind === "video" ? (
              <span className="absolute bottom-1.5 left-1.5 flex size-6 items-center justify-center rounded-full bg-foreground/60 text-background">
                <Play className="size-3" strokeWidth={2} />
              </span>
            ) : null}
            {locked ? (
              <span className="absolute inset-0 flex items-center justify-center bg-foreground/25 text-background">
                <Lock className="size-5" strokeWidth={1.6} />
              </span>
            ) : null}
            {selecting ? (
              <span
                className={cn(
                  "absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full border",
                  isSelected
                    ? "pop border-primary bg-primary text-primary-foreground"
                    : "border-background/70 bg-foreground/25 text-background",
                )}
              >
                {isSelected ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
