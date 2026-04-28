export type Lesson = {
  id: string;
  track: "cfop" | "roux" | "comp-prep" | "getting-faster";
  phase: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  videos: { url: string; title: string; source: string }[];
  tips: string[];
};

export type LessonState = "done" | "current" | "todo" | "locked";

export type LessonWithState = Lesson & { state: LessonState };
