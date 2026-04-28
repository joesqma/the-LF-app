import { cfopLessons } from "./cfop";
import { compPrepLessons } from "./comp-prep";
import { rouxLessons } from "./roux";
import type { Lesson } from "./types";

const allLessons: Lesson[] = [
  ...cfopLessons,
  ...rouxLessons,
  ...compPrepLessons,
];

export function getRecommendedLesson(
  method: string | null,
  completedLessons: string[],
  analysisLessonIds?: string[] | null,
): Lesson | null {
  if (analysisLessonIds?.length) {
    for (const id of analysisLessonIds) {
      if (!completedLessons.includes(id)) {
        const lesson = allLessons.find((l) => l.id === id);
        if (lesson) return lesson;
      }
    }
  }
  const trackLessons = method === "roux" ? rouxLessons : cfopLessons;
  return trackLessons.find((l) => !completedLessons.includes(l.id)) ?? null;
}
