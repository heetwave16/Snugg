import { useLocalSearchParams } from "expo-router";
import { MediaViewerPlaceholder } from "@/components/MediaViewerPlaceholder";
import { getMediaItem } from "@/data/mockData";

export default function MediaViewerScreen() {
  const { mediaId } = useLocalSearchParams<{ mediaId?: string }>();
  const item = getMediaItem(typeof mediaId === "string" ? mediaId : "goa-01");

  return <MediaViewerPlaceholder item={item} />;
}

