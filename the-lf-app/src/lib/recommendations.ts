import type { AnalysisReport } from "~/types/analysis";
import type { UserProfile } from "~/types/database";
import { cfopLessons } from "./content/cfop";
import { compPrepLessons } from "./content/comp-prep";
import { rouxLessons } from "./content/roux";
import type { Lesson } from "./content/types";

const allLessons: Lesson[] = [
  ...cfopLessons,
  ...rouxLessons,
  ...compPrepLessons,
];

// cfop_level value → lesson ID that fills the gap
const CFOP_LEVEL_LESSON: Record<string, string> = {
  none: "cfop-oll-1",
  "2look_oll": "cfop-pll-1",
};

const CFOP_LEVEL_REASON: Record<string, string> = {
  none: "Learn 2-Look OLL to cut your solve times",
  "2look_oll": "Learn 2-Look PLL to complete your last layer",
};

export type Recommendation =
  | { kind: "lesson"; lesson: Lesson; reason: string }
  | { kind: "analysis"; reason: string }
  | { kind: "timer"; reason: string };

type Input = {
  profile: Pick<
    UserProfile,
    "knows_how_to_solve" | "method" | "completed_lessons" | "cfop_level"
  >;
  recentAnalysis?: { report: unknown } | null;
  analysisCount: number;
  totalSolves: number;
};

function findLesson(id: string): Lesson | undefined {
  return allLessons.find((l) => l.id === id);
}

export function getRecommendedLesson({
  profile,
  recentAnalysis,
  analysisCount,
  totalSolves,
}: Input): Recommendation | null {
  const completedLessons = (profile.completed_lessons as string[] | null) ?? [];

  // Absolute beginner — learn to solve first
  if (!profile.knows_how_to_solve) {
    const lesson = findLesson("cfop-cross-1");
    if (lesson) return { kind: "lesson", lesson, reason: "Start your journey" };
    return null;
  }

  // No analysis yet — highest value action for someone who can already solve
  if (analysisCount === 0) {
    return { kind: "analysis", reason: "See exactly where you're losing time" };
  }

  // No solves logged — prompt timer
  if (totalSolves === 0) {
    return { kind: "timer", reason: "Track your progress with the timer" };
  }

  // cfop_level gap — recommend the lesson that fills it
  if (profile.method === "cfop" && profile.cfop_level) {
    const targetId = CFOP_LEVEL_LESSON[profile.cfop_level];
    if (targetId && !completedLessons.includes(targetId)) {
      const lesson = findLesson(targetId);
      if (lesson) {
        return {
          kind: "lesson",
          lesson,
          reason: CFOP_LEVEL_REASON[profile.cfop_level] ?? "Continue learning",
        };
      }
    }
  }

  // Analysis-recommended lesson
  const report = recentAnalysis?.report as AnalysisReport | null;
  if (report?.recommended_lesson_ids?.length) {
    for (const id of report.recommended_lesson_ids) {
      if (!completedLessons.includes(id)) {
        const lesson = findLesson(id);
        if (lesson) {
          return {
            kind: "lesson",
            lesson,
            reason: "Based on your latest analysis",
          };
        }
      }
    }
  }

  // Next uncompleted lesson in the user's method track
  const trackLessons = profile.method === "roux" ? rouxLessons : cfopLessons;
  const methodLabel = profile.method === "roux" ? "Roux" : "CFOP";
  const nextLesson = trackLessons.find((l) => !completedLessons.includes(l.id));
  if (nextLesson) {
    return {
      kind: "lesson",
      lesson: nextLesson,
      reason: `Continue your ${methodLabel} journey`,
    };
  }

  // Fallback
  const fallback = findLesson("cfop-cross-1");
  if (fallback)
    return { kind: "lesson", lesson: fallback, reason: "Start your journey" };
  return null;
}
