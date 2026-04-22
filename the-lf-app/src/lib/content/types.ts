export type Lesson = {
  id: string;
  track: "cfop" | "roux" | "comp-prep";
  phase: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  videos: { url: string; title: string; source: string }[];
  tips: string[];
};
