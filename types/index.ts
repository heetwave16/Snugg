import type { ImageSourcePropType } from "react-native";

export type MediaKind = "photo" | "video";

export type MediaItem = {
  id: string;
  source: ImageSourcePropType;
  kind: MediaKind;
  duration?: string;
  dateLabel: string;
  albumLabel?: string;
};

export type Space = {
  id: string;
  name: string;
  cover: ImageSourcePropType;
  memoryCount: number;
  memberCount: number;
  lastUpdated: string;
  description: string;
};

export type Member = {
  id: string;
  name: string;
  initials: string;
  uploads: number;
  source: ImageSourcePropType;
  role?: string;
};
