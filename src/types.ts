export type ClipKind = "TEXT" | "CODE" | "IMAGE";

export interface Clip {
  id: number;
  content: string;
  clipType: ClipKind;
  timestamp: number;
  pinned: boolean;
  thumbnail: string | null;
}

export type TabFilter = "all" | "TEXT" | "CODE" | "IMAGE";
