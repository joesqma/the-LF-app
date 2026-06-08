import Link from "next/link";
import { cfopLessons } from "~/lib/content/cfop";
import { compPrepLessons } from "~/lib/content/comp-prep";

const ALL_LESSONS = [...cfopLessons, ...compPrepLessons];
const LESSON_MAP = new Map(ALL_LESSONS.map((l) => [l.id, l]));

const TRACK_LABELS: Record<string, string> = {
  cfop: "CFOP",
  "comp-prep": "COMP PREP",
};

interface Props {
  lessonIds: string[];
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export function RecommendedLessons({ lessonIds }: Props) {
  const lessons = lessonIds
    .map((id) => LESSON_MAP.get(id))
    .filter(Boolean)
    .slice(0, 3);

  if (lessons.length === 0) return null;

  return (
    <div>
      <p
        style={{
          ...mono,
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--t3)",
          marginBottom: "12px",
        }}
      >
        Recommended lessons
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {lessons.map((lesson) => {
          if (!lesson) return null;
          const href = `/learn/${lesson.track}/${lesson.id}`;
          const trackLabel =
            TRACK_LABELS[lesson.track] ?? lesson.track.toUpperCase();
          return (
            <Link
              key={lesson.id}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--s1)",
                border: "0.5px solid var(--b2)",
                borderRadius: "12px",
                padding: "12px 16px",
                textDecoration: "none",
                transition: "background-color 150ms, border-color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--s2)";
                e.currentTarget.style.borderColor = "var(--b3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--s1)";
                e.currentTarget.style.borderColor = "var(--b2)";
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    ...sans,
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--t1)",
                    marginBottom: "2px",
                  }}
                >
                  {lesson.title}
                </p>
                <p
                  style={{
                    ...mono,
                    fontSize: "10px",
                    fontWeight: 400,
                    color: "var(--t3)",
                  }}
                >
                  {lesson.phase} · {lesson.estimatedMinutes} min
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    ...mono,
                    fontSize: "9px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    background: "var(--blue-dim)",
                    color: "var(--blue)",
                    borderRadius: "20px",
                    padding: "2px 8px",
                  }}
                >
                  {trackLabel}
                </span>
                <span
                  style={{
                    ...mono,
                    fontSize: "11px",
                    color: "var(--t3)",
                  }}
                >
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
