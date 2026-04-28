import Link from "next/link";
import { cfopLessons } from "~/lib/content/cfop";
import { compPrepLessons } from "~/lib/content/comp-prep";
import { rouxLessons } from "~/lib/content/roux";

const ALL_LESSONS = [...cfopLessons, ...rouxLessons, ...compPrepLessons];
const LESSON_MAP = new Map(ALL_LESSONS.map((l) => [l.id, l]));

const TRACK_LABELS: Record<string, string> = {
  cfop: "CFOP",
  roux: "Roux",
  "comp-prep": "Comp Prep",
};

interface Props {
  lessonIds: string[];
}

export function RecommendedLessons({ lessonIds }: Props) {
  const lessons = lessonIds
    .map((id) => LESSON_MAP.get(id))
    .filter(Boolean)
    .slice(0, 3);

  if (lessons.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Recommended lessons
      </p>
      <div className="flex flex-col gap-2">
        {lessons.map((lesson) => {
          if (!lesson) return null;
          const href = `/learn/${lesson.track}/${lesson.id}`;
          return (
            <Link
              key={lesson.id}
              href={href}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/60"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">
                  {lesson.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lesson.phase} · {lesson.estimatedMinutes} min
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-medium text-background">
                {TRACK_LABELS[lesson.track] ?? lesson.track}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
