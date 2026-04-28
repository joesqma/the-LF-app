import { CFOP_PHASES, cfopLessons } from "./cfop";
import { COMP_PREP_PHASES, compPrepLessons } from "./comp-prep";
import { GETTING_FASTER_PHASES, gettingFasterLessons } from "./getting-faster";
import { ROUX_PHASES, rouxLessons } from "./roux";
import type { Lesson, LessonState, LessonWithState } from "./types";

export type TrackId =
  | "first-solve"
  | "beginner"
  | "foundations"
  | "cfop"
  | "roux"
  | "getting-faster"
  | "comp-prep";

export type TrackConfig = {
  id: TrackId;
  name: string;
  emoji: string;
  description: string;
  soon: boolean;
  pillActiveBorder: string;
  pillActiveBg: string;
  gradient: string;
};

export const TRACKS: TrackConfig[] = [
  {
    id: "first-solve",
    name: "The First Solve",
    emoji: "🎯",
    description:
      "Never solved a Rubik's Cube? Start here. Step-by-step from zero to your very first complete solve.",
    soon: false,
    pillActiveBorder: "#1d3557",
    pillActiveBg: "#0a1625",
    gradient: "linear-gradient(90deg, #3b82f6, #6366f1)",
  },
  {
    id: "beginner",
    name: "Beginner Method",
    emoji: "📖",
    description:
      "A reliable layer-by-layer approach. Consistent, easy to memorize, and the foundation for every advanced method.",
    soon: true,
    pillActiveBorder: "",
    pillActiveBg: "",
    gradient: "",
  },
  {
    id: "foundations",
    name: "Cubing Foundations",
    emoji: "🔩",
    description:
      "Notation, cube anatomy, and the core concepts every cuber needs before diving into speedsolving.",
    soon: true,
    pillActiveBorder: "",
    pillActiveBg: "",
    gradient: "",
  },
  {
    id: "cfop",
    name: "CFOP",
    emoji: "⚡",
    description:
      "The most popular speedsolving method. Master Cross, F2L, OLL, and PLL to break into sub-20.",
    soon: false,
    pillActiveBorder: "#1d3557",
    pillActiveBg: "#0a1625",
    gradient: "linear-gradient(90deg, #3b82f6, #6366f1)",
  },
  {
    id: "roux",
    name: "Roux",
    emoji: "🟧",
    description:
      "A block-building method with a low move count. Preferred by many sub-10 solvers worldwide.",
    soon: true,
    pillActiveBorder: "#3b1f69",
    pillActiveBg: "#100920",
    gradient: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
  },
  {
    id: "getting-faster",
    name: "Getting Faster",
    emoji: "📈",
    description:
      "Lookahead, fingertricks, TPS drills, and the practice habits that separate fast from faster.",
    soon: false,
    pillActiveBorder: "#14532d",
    pillActiveBg: "#071510",
    gradient: "linear-gradient(90deg, #22c55e, #34d399)",
  },
  {
    id: "comp-prep",
    name: "Competition Prep",
    emoji: "🏆",
    description:
      "Scorecards, penalties, warm-up routines, and the mental side of competing at WCA events.",
    soon: false,
    pillActiveBorder: "#5a3a08",
    pillActiveBg: "#160e00",
    gradient: "linear-gradient(90deg, #f59e0b, #fbbf24)",
  },
];

const TRACK_LESSONS: Partial<Record<TrackId, Lesson[]>> = {
  cfop: cfopLessons,
  roux: rouxLessons,
  "getting-faster": gettingFasterLessons,
  "comp-prep": compPrepLessons,
};

export const TRACK_PHASE_ORDER_MAP: Partial<
  Record<TrackId, readonly string[]>
> = {
  cfop: CFOP_PHASES,
  roux: ROUX_PHASES,
  "getting-faster": GETTING_FASTER_PHASES,
  "comp-prep": COMP_PREP_PHASES,
};

export function getTrackConfig(id: string): TrackConfig | undefined {
  return TRACKS.find((t) => t.id === id);
}

export function getOrderedLessons(trackId: TrackId): Lesson[] {
  const phaseOrder = TRACK_PHASE_ORDER_MAP[trackId] ?? [];
  const lessons = TRACK_LESSONS[trackId] ?? [];
  return phaseOrder.flatMap((phase) =>
    lessons.filter((l) => l.phase === phase).sort((a, b) => a.order - b.order),
  );
}

export function deriveLessonStates(
  lessons: Lesson[],
  completedIds: Set<string>,
): LessonWithState[] {
  let currentAssigned = false;
  let todoAssigned = false;

  return lessons.map((lesson) => {
    if (completedIds.has(lesson.id)) {
      return { ...lesson, state: "done" as LessonState };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { ...lesson, state: "current" as LessonState };
    }
    if (!todoAssigned) {
      todoAssigned = true;
      return { ...lesson, state: "todo" as LessonState };
    }
    return { ...lesson, state: "locked" as LessonState };
  });
}

export function getTrackProgress(
  trackId: TrackId,
  completedIds: Set<string>,
): { done: number; total: number } {
  const lessons = TRACK_LESSONS[trackId] ?? [];
  return {
    done: lessons.filter((l) => completedIds.has(l.id)).length,
    total: lessons.length,
  };
}

export function groupByPhase(
  lessons: LessonWithState[],
  phaseOrder: readonly string[],
): { label: string; lessons: LessonWithState[] }[] {
  return phaseOrder
    .map((phase) => ({
      label: phase,
      lessons: lessons.filter((l) => l.phase === phase),
    }))
    .filter((p) => p.lessons.length > 0);
}
