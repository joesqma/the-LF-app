import Link from "next/link";
import { redirect } from "next/navigation";
import type { TrackId } from "~/lib/content/tracks";
import {
  deriveLessonStates,
  getOrderedLessons,
  getTrackConfig,
  getTrackProgress,
  groupByPhase,
  TRACK_PHASE_ORDER_MAP,
  TRACKS,
} from "~/lib/content/tracks";
import type { LessonWithState } from "~/lib/content/types";
import { createClient } from "~/lib/supabase/server";
import type { AnalysisReport } from "~/types/analysis";

interface Props {
  params: Promise<{ track: string }>;
}

const TRACK_ACCENT: Partial<Record<string, string>> = {
  "first-solve": "var(--blue)",
  cfop: "var(--blue)",
  "getting-faster": "var(--green)",
  "comp-prep": "var(--orange)",
};

const TRACK_ACCENT_DIM: Partial<Record<string, string>> = {
  "first-solve": "var(--blue-dim)",
  cfop: "var(--blue-dim)",
  "getting-faster": "var(--green-dim)",
  "comp-prep": "var(--orange-dim)",
};

const mono: React.CSSProperties = {
  fontFamily: "var(--font-roboto-mono), 'Roboto Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export default async function TrackPage({ params }: Props) {
  const { track } = await params;
  const trackConfig = getTrackConfig(track);
  if (!trackConfig) redirect("/learn/cfop");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, analysisResult] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("completed_lessons")
      .eq("id", user.id)
      .single(),
    supabase
      .from("analyses")
      .select("report")
      .eq("user_id", user.id)
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const completedIds = new Set<string>(
    (profileResult.data?.completed_lessons as string[] | null) ?? [],
  );

  const analysisReport = analysisResult.data
    ?.report as unknown as AnalysisReport | null;
  const recommendedIds = analysisReport?.recommended_lesson_ids ?? [];

  const trackProgress = Object.fromEntries(
    TRACKS.filter((t) => !t.soon).map((t) => [
      t.id,
      getTrackProgress(t.id as TrackId, completedIds),
    ]),
  );

  let phases: { label: string; lessons: LessonWithState[] }[] = [];
  let currentLesson: LessonWithState | null = null;
  let hasStarted = false;

  if (!trackConfig.soon) {
    const ordered = getOrderedLessons(trackConfig.id as TrackId);
    const withStates = deriveLessonStates(ordered, completedIds);
    const phaseOrder = TRACK_PHASE_ORDER_MAP[trackConfig.id as TrackId] ?? [];
    phases = groupByPhase(withStates, phaseOrder);
    currentLesson = withStates.find((l) => l.state === "current") ?? null;
    hasStarted = withStates.some((l) => l.state === "done");
  }

  let aiBadgePhase: string | null = null;
  if (!trackConfig.soon && recommendedIds.length > 0) {
    const ordered = getOrderedLessons(trackConfig.id as TrackId);
    for (const rid of recommendedIds) {
      const found = ordered.find((l) => l.id === rid);
      if (found) {
        aiBadgePhase = found.phase;
        break;
      }
    }
  }

  const progress = trackProgress[trackConfig.id];
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;
  const isComplete = progress
    ? progress.done === progress.total && progress.total > 0
    : false;
  const accent = TRACK_ACCENT[trackConfig.id];
  const accentDim = TRACK_ACCENT_DIM[trackConfig.id];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* Fixed top: eyebrow + card scroll */}
      <div
        style={{
          padding: "32px 36px 0",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            ...mono,
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--blue)",
            marginBottom: "16px",
          }}
        >
          Learn
        </p>

        {/* Horizontal track card scroll */}
        <div className="lrn-track-scroll">
          {TRACKS.map((t) => {
            const isActive = t.id === trackConfig.id;
            const prog = !t.soon ? trackProgress[t.id] : null;
            const tAccent = TRACK_ACCENT[t.id];
            const tPct =
              prog && prog.total > 0
                ? Math.round((prog.done / prog.total) * 100)
                : 0;
            const tComplete = prog
              ? prog.done === prog.total && prog.total > 0
              : false;

            const cardBody = (
              <>
                {/* Accent bar */}
                <div
                  aria-hidden="true"
                  style={{
                    height: "2px",
                    flexShrink: 0,
                    background: tAccent ?? "var(--b2)",
                  }}
                />
                {/* Body */}
                <div
                  style={{
                    padding: "14px 16px 16px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{ fontSize: "22px", lineHeight: 1, flexShrink: 0 }}
                    >
                      {t.emoji}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          ...sans,
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--t1)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.name}
                      </p>
                      {t.soon && (
                        <span
                          style={{
                            ...mono,
                            fontSize: "9px",
                            fontWeight: 600,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            color: "var(--t3)",
                            background: "var(--s2)",
                            border: "0.5px solid var(--b2)",
                            borderRadius: "20px",
                            padding: "2px 7px",
                            display: "inline-block",
                            marginTop: "3px",
                          }}
                        >
                          Coming soon
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      ...sans,
                      fontSize: "11.5px",
                      color: "var(--t2)",
                      lineHeight: 1.55,
                      flex: 1,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {t.description}
                  </p>

                  {!t.soon && prog && prog.total > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "5px",
                        }}
                      >
                        <span
                          style={{
                            ...mono,
                            fontSize: "10px",
                            color: "var(--t3)",
                          }}
                        >
                          {prog.done} / {prog.total} lessons
                        </span>
                        <span
                          style={{
                            ...mono,
                            fontSize: "10px",
                            fontWeight: 600,
                            color: tComplete
                              ? "var(--green)"
                              : (tAccent ?? "var(--t3)"),
                          }}
                        >
                          {tComplete ? "✓" : `${tPct}%`}
                        </span>
                      </div>
                      <div
                        style={{
                          height: "3px",
                          background: "var(--s3)",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: tComplete
                              ? "var(--green)"
                              : (tAccent ?? "var(--blue)"),
                            borderRadius: "2px",
                            width: `${tPct}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {!t.soon && (!prog || prog.total === 0) && (
                    <div style={{ marginTop: "auto" }}>
                      <span
                        style={{
                          ...mono,
                          fontSize: "10px",
                          color: "var(--t3)",
                        }}
                      >
                        Start learning →
                      </span>
                    </div>
                  )}
                </div>
              </>
            );

            if (isActive) {
              return (
                <div
                  key={t.id}
                  className="lrn-track-card lrn-track-card-active"
                >
                  {cardBody}
                </div>
              );
            }
            if (t.soon) {
              return (
                <div key={t.id} className="lrn-track-card lrn-track-card-soon">
                  {cardBody}
                </div>
              );
            }
            return (
              <Link
                key={t.id}
                href={`/learn/${t.id}`}
                className="lrn-track-card"
              >
                {cardBody}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          margin: "20px 36px 0",
          height: "0.5px",
          flexShrink: 0,
          background: "var(--b1)",
        }}
      />

      {/* Scrollable content */}
      <div
        key={track}
        className="lrn-scroll lrn-fade-up"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "28px 36px 60px",
        }}
      >
        {/* Track header */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              marginBottom: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "26px", lineHeight: 1 }}>
                {trackConfig.emoji}
              </span>
              <h1
                style={{
                  ...sans,
                  fontSize: "24px",
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  color: "var(--t1)",
                }}
              >
                {trackConfig.name}
              </h1>
            </div>

            {!trackConfig.soon && currentLesson && (
              <Link
                href={`/learn/${trackConfig.id}/${currentLesson.id}`}
                className="cb-primary-btn"
                style={{ flexShrink: 0 }}
              >
                {hasStarted ? "Continue →" : "Start track →"}
              </Link>
            )}
          </div>

          <p
            style={{
              ...sans,
              fontSize: "13px",
              color: "var(--t2)",
              lineHeight: 1.65,
              maxWidth: "520px",
              marginBottom:
                aiBadgePhase || (progress && progress.total > 0) ? "14px" : "0",
            }}
          >
            {trackConfig.description}
          </p>

          {aiBadgePhase && (
            <span
              style={{
                ...mono,
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "1px",
                textTransform: "uppercase",
                padding: "3px 9px",
                borderRadius: "20px",
                background: "var(--purple-dim)",
                color: "var(--purple)",
                border: "0.5px solid rgba(157,110,255,0.25)",
                display: "inline-block",
                marginBottom: "14px",
              }}
            >
              AI focus: {aiBadgePhase}
            </span>
          )}

          {!trackConfig.soon && progress && progress.total > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "200px",
                  height: "3px",
                  background: "var(--s3)",
                  borderRadius: "2px",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: isComplete
                      ? "var(--green)"
                      : (accent ?? "var(--blue)"),
                    borderRadius: "2px",
                    transition: "width 400ms",
                  }}
                />
              </div>
              <span
                style={{
                  ...mono,
                  fontSize: "10px",
                  color: isComplete
                    ? "var(--green)"
                    : accentDim
                      ? accent
                      : "var(--t3)",
                }}
              >
                {isComplete
                  ? `${progress.total} / ${progress.total} · Complete`
                  : `${progress.done} / ${progress.total} lessons · ${pct}%`}
              </span>
            </div>
          )}
        </div>

        {/* Coming soon */}
        {trackConfig.soon ? (
          <div
            className="lrn-fade-up-slow"
            style={{
              paddingTop: "48px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--t3)",
                marginBottom: "14px",
              }}
            >
              Coming soon
            </p>
            <h2
              style={{
                ...sans,
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--t1)",
                letterSpacing: "-0.5px",
                marginBottom: "10px",
              }}
            >
              This track is on its way.
            </h2>
            <p
              style={{
                ...sans,
                fontSize: "13px",
                color: "var(--t3)",
                lineHeight: 1.7,
                maxWidth: "360px",
              }}
            >
              We&apos;re building this track now. Check back soon — it&apos;ll
              be worth the wait.
            </p>
          </div>
        ) : (
          /* Lesson grid */
          <div
            className="lrn-fade-up-slow"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "24px 20px",
            }}
          >
            {phases.map((phase) => (
              <div key={phase.label}>
                <p
                  style={{
                    ...mono,
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                    color: "var(--t3)",
                    marginBottom: "8px",
                    paddingLeft: "2px",
                  }}
                >
                  {phase.label}
                </p>
                {phase.lessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    track={trackConfig.id}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  track,
}: {
  lesson: LessonWithState;
  track: string;
}) {
  const isLocked = lesson.state === "locked";

  const rowStyle: React.CSSProperties = {
    overflow: "hidden",
    minWidth: 0,
    ...(lesson.state === "current"
      ? {
          background: "var(--blue-dim)",
          borderColor: "rgba(0,168,255,0.2)",
        }
      : {}),
  };

  const titleColor =
    lesson.state === "current"
      ? "var(--t1)"
      : lesson.state === "done"
        ? "var(--t3)"
        : "var(--t2)";

  const metaColor = "var(--t3)";

  const inner = (
    <>
      <StatusCircle state={lesson.state} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
            fontSize: "13px",
            fontWeight: lesson.state === "current" ? 500 : 400,
            color: titleColor,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {lesson.title}
        </p>
        <p
          style={{
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
            fontSize: "11px",
            fontWeight: 300,
            color: metaColor,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginTop: "1px",
          }}
        >
          {lesson.description}
        </p>
      </div>
      {!isLocked && (
        <span
          style={{
            fontFamily: "var(--font-roboto-mono), 'Roboto Mono', monospace",
            fontSize: "10px",
            color: "var(--t3)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {lesson.estimatedMinutes} min
        </span>
      )}
    </>
  );

  if (isLocked) {
    return (
      <div className="lrn-row lrn-row-locked" style={rowStyle}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/learn/${track}/${lesson.id}`}
      className={[
        "lrn-row",
        lesson.state === "done" ? "lrn-row-done" : "",
        lesson.state === "todo" ? "lrn-row-todo" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={rowStyle}
    >
      {inner}
    </Link>
  );
}

function StatusCircle({ state }: { state: LessonWithState["state"] }) {
  if (state === "done") {
    return (
      <div className="lrn-circle lrn-circle-done">
        <svg
          width="9"
          height="7"
          viewBox="0 0 9 7"
          fill="none"
          aria-hidden="true"
        >
          <polyline
            points="1,3.5 3.5,6 8,1"
            stroke="var(--green)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (state === "current") {
    return (
      <div className="lrn-circle lrn-circle-current">
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "var(--blue)",
          }}
        />
      </div>
    );
  }

  if (state === "todo") {
    return (
      <div className="lrn-circle">
        <div
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--t3)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="lrn-circle">
      <div className="lrn-lock" />
    </div>
  );
}
