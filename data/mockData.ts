import type { ImageSourcePropType } from "react-native";

import type { MediaItem, Member, Space } from "@/types";

const image01 = require("@/assets/mock/photo-01.jpg") as ImageSourcePropType;
const image02 = require("@/assets/mock/photo-02.jpg") as ImageSourcePropType;
const image03 = require("@/assets/mock/photo-03.jpg") as ImageSourcePropType;
const image04 = require("@/assets/mock/photo-04.jpg") as ImageSourcePropType;
const image05 = require("@/assets/mock/photo-05.jpg") as ImageSourcePropType;
const image06 = require("@/assets/mock/photo-06.jpg") as ImageSourcePropType;
const image07 = require("@/assets/mock/photo-07.jpg") as ImageSourcePropType;
const image08 = require("@/assets/mock/photo-08.jpg") as ImageSourcePropType;
const image09 = require("@/assets/mock/photo-09.jpg") as ImageSourcePropType;
const image10 = require("@/assets/mock/photo-10.jpg") as ImageSourcePropType;
const image11 = require("@/assets/mock/photo-11.jpg") as ImageSourcePropType;
const image12 = require("@/assets/mock/photo-12.jpg") as ImageSourcePropType;

export const mockSpaces: Space[] = [
  {
    id: "goa-trip-26",
    name: "Goa Trip '26",
    cover: image01,
    memoryCount: 381,
    memberCount: 8,
    lastUpdated: "Updated today",
    description: "Salt in our hair, nowhere else to be.",
  },
  {
    id: "college-fest",
    name: "College Fest",
    cover: image07,
    memoryCount: 214,
    memberCount: 24,
    lastUpdated: "Updated yesterday",
    description: "The loud, bright, slightly blurry one.",
  },
  {
    id: "weekend-memories",
    name: "Weekend Memories",
    cover: image10,
    memoryCount: 93,
    memberCount: 6,
    lastUpdated: "Updated 3 days ago",
    description: "Small plans. Best stories.",
  },
];

const goaMedia: MediaItem[] = [
  { id: "goa-01", source: image01, kind: "photo", dateLabel: "24 Aug", albumLabel: "The beach day" },
  { id: "goa-02", source: image02, kind: "photo", dateLabel: "24 Aug", albumLabel: "The beach day" },
  { id: "goa-03", source: image03, kind: "video", duration: "0:18", dateLabel: "24 Aug", albumLabel: "The beach day" },
  { id: "goa-04", source: image04, kind: "photo", dateLabel: "23 Aug", albumLabel: "First night" },
  { id: "goa-05", source: image05, kind: "photo", dateLabel: "23 Aug", albumLabel: "First night" },
  { id: "goa-06", source: image06, kind: "photo", dateLabel: "23 Aug", albumLabel: "First night" },
  { id: "goa-07", source: image07, kind: "photo", dateLabel: "22 Aug", albumLabel: "Check in" },
  { id: "goa-08", source: image08, kind: "video", duration: "0:42", dateLabel: "22 Aug", albumLabel: "Check in" },
  { id: "goa-09", source: image09, kind: "photo", dateLabel: "22 Aug", albumLabel: "Check in" },
  { id: "goa-10", source: image10, kind: "photo", dateLabel: "21 Aug", albumLabel: "On the way" },
  { id: "goa-11", source: image11, kind: "photo", dateLabel: "21 Aug", albumLabel: "On the way" },
  { id: "goa-12", source: image12, kind: "photo", dateLabel: "21 Aug", albumLabel: "On the way" },
];

const festMedia: MediaItem[] = [
  { id: "fest-01", source: image07, kind: "photo", dateLabel: "12 Mar", albumLabel: "Opening night" },
  { id: "fest-02", source: image08, kind: "video", duration: "0:26", dateLabel: "12 Mar", albumLabel: "Opening night" },
  { id: "fest-03", source: image09, kind: "photo", dateLabel: "12 Mar", albumLabel: "Opening night" },
  { id: "fest-04", source: image10, kind: "photo", dateLabel: "11 Mar", albumLabel: "Between sets" },
  { id: "fest-05", source: image11, kind: "photo", dateLabel: "11 Mar", albumLabel: "Between sets" },
  { id: "fest-06", source: image12, kind: "photo", dateLabel: "11 Mar", albumLabel: "Between sets" },
  { id: "fest-07", source: image01, kind: "photo", dateLabel: "10 Mar", albumLabel: "First day" },
  { id: "fest-08", source: image02, kind: "photo", dateLabel: "10 Mar", albumLabel: "First day" },
  { id: "fest-09", source: image03, kind: "video", duration: "1:03", dateLabel: "10 Mar", albumLabel: "First day" },
];

const weekendMedia: MediaItem[] = [
  { id: "weekend-01", source: image10, kind: "photo", dateLabel: "07 Feb", albumLabel: "Saturday" },
  { id: "weekend-02", source: image11, kind: "photo", dateLabel: "07 Feb", albumLabel: "Saturday" },
  { id: "weekend-03", source: image12, kind: "video", duration: "0:12", dateLabel: "07 Feb", albumLabel: "Saturday" },
  { id: "weekend-04", source: image04, kind: "photo", dateLabel: "06 Feb", albumLabel: "Friday night" },
  { id: "weekend-05", source: image05, kind: "photo", dateLabel: "06 Feb", albumLabel: "Friday night" },
  { id: "weekend-06", source: image06, kind: "photo", dateLabel: "06 Feb", albumLabel: "Friday night" },
];

export const mockMediaBySpace: Record<string, MediaItem[]> = {
  "goa-trip-26": goaMedia,
  "college-fest": festMedia,
  "weekend-memories": weekendMedia,
};

export const mockMembers: Member[] = [
  { id: "rahul", name: "Rahul", initials: "R", uploads: 381, source: image02, role: "Space host" },
  { id: "aryan", name: "Aryan", initials: "A", uploads: 93, source: image05 },
  { id: "heet", name: "Heet", initials: "H", uploads: 142, source: image09 },
  { id: "riya", name: "Riya", initials: "R", uploads: 76, source: image04 },
  { id: "sana", name: "Sana", initials: "S", uploads: 54, source: image11 },
  { id: "dev", name: "Dev", initials: "D", uploads: 28, source: image07 },
];

export type MockAlbum = {
  id: string;
  title: string;
  date: string;
  count: number;
  cover: ImageSourcePropType;
};

export const mockAlbumsBySpace: Record<string, MockAlbum[]> = {
  "goa-trip-26": [
    { id: "beach-day", title: "The beach day", date: "24 Aug", count: 84, cover: image01 },
    { id: "first-night", title: "First night", date: "23 Aug", count: 67, cover: image04 },
    { id: "check-in", title: "Check in", date: "22 Aug", count: 42, cover: image07 },
  ],
  "college-fest": [
    { id: "opening-night", title: "Opening night", date: "12 Mar", count: 58, cover: image07 },
    { id: "between-sets", title: "Between sets", date: "11 Mar", count: 71, cover: image10 },
    { id: "first-day", title: "First day", date: "10 Mar", count: 85, cover: image01 },
  ],
  "weekend-memories": [
    { id: "saturday", title: "Saturday", date: "07 Feb", count: 34, cover: image10 },
    { id: "friday-night", title: "Friday night", date: "06 Feb", count: 29, cover: image04 },
    { id: "slow-morning", title: "Slow morning", date: "06 Feb", count: 18, cover: image06 },
  ],
};

export function getSpace(spaceId: string) {
  return mockSpaces.find((space) => space.id === spaceId) ?? mockSpaces[0];
}

export function getMedia(spaceId: string) {
  return mockMediaBySpace[spaceId] ?? goaMedia;
}

export function getAlbums(spaceId: string) {
  return mockAlbumsBySpace[spaceId] ?? mockAlbumsBySpace["goa-trip-26"];
}

export function getMediaItem(mediaId: string) {
  return Object.values(mockMediaBySpace)
    .flat()
    .find((media) => media.id === mediaId) ?? goaMedia[0];
}
