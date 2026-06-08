import { cfopLessons } from "./cfop";
import { compPrepLessons } from "./comp-prep";
import type { Lesson } from "./types";

const allLessons: Lesson[] = [...cfopLessons, ...compPrepLessons];

export function getRecommendedLesson(
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
  return cfopLessons.find((l) => !completedLessons.includes(l.id)) ?? null;
}
