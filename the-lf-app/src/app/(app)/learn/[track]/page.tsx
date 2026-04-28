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

  // Progress counts for all tracks
  const trackProgress = Object.fromEntries(
    TRACKS.filter((t) => !t.soon).map((t) => [
      t.id,
      getTrackProgress(t.id as TrackId, completedIds),
    ]),
  );

  // Derive phases for the current track (if not soon)
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

  // AI badge: first recommended lesson that belongs to this track
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        background: "var(--bg-base)",
      }}
    >
      {/* Section 1 — Page header */}
      <div style={{ padding: "36px 24px 0", flexShrink: 0 }}>
        <p
          className="font-dm-sans"
          style={{
            fontSize: "11px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-dim)",
          }}
        >
          Learn
        </p>
      </div>

      {/* Section 2 — Track switcher */}
      <div
        style={{
          padding: "28px 24px 0",
          flexShrink: 0,
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <div className="lrn-pills-row">
          {TRACKS.map((t) => {
            const isActive = t.id === trackConfig.id;
            const prog = trackProgress[t.id];

            return (
              <Link
                key={t.id}
                href={t.soon ? "#" : `/learn/${t.id}`}
                aria-disabled={t.soon}
                className={[
                  "lrn-pill font-dm-sans",
                  t.soon ? "lrn-pill-soon" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  isActive && !t.soon
                    ? {
                        borderColor: t.pillActiveBorder,
                        background: t.pillActiveBg,
                      }
                    : undefined
                }
              >
                <span style={{ fontSize: "13px" }}>{t.emoji}</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: isActive
                      ? "var(--text-secondary)"
                      : "var(--text-dim)",
                  }}
                >
                  {t.name}
                </span>
                {!t.soon && prog ? (
                  <span
                    className="font-dm-sans"
                    style={{
                      fontSize: "10px",
                      padding: "1px 6px",
                      borderRadius: "20px",
                      color: "var(--text-dimmer)",
                      background: isActive ? "transparent" : "#161616",
                      border: isActive
                        ? "1px solid transparent"
                        : "1px solid #1d1d1d",
                    }}
                  >
                    {prog.done}/{prog.total}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Section 3 — Divider */}
      <div
        style={{
          margin: "20px 24px 0",
          height: "1px",
          flexShrink: 0,
          background: "var(--border-default)",
        }}
      />

      {/* Section 4 — Scrollable content */}
      <div
        key={track}
        className="lrn-scroll lrn-fade-up"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minWidth: 0,
          width: "100%",
          boxSizing: "border-box",
          padding: "32px 24px 60px",
        }}
      >
        <div
          style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
        >
          {/* Track header */}
          <div style={{ marginBottom: "32px" }}>
            {/* Name row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span style={{ fontSize: "28px" }}>{trackConfig.emoji}</span>
                  <h1
                    className="font-syne"
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      color: "var(--text-primary)",
                    }}
                  >
                    {trackConfig.name}
                  </h1>
                </div>
                {aiBadgePhase && (
                  <div style={{ marginTop: "8px" }}>
                    <span
                      className="font-dm-sans"
                      style={{
                        fontSize: "10px",
                        fontWeight: 500,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        padding: "3px 9px",
                        borderRadius: "20px",
                        background: "#1a0f3d",
                        color: "#8b5cf6",
                        border: "1px solid #2d1b69",
                      }}
                    >
                      AI: {aiBadgePhase}
                    </span>
                  </div>
                )}
              </div>

              {!trackConfig.soon && currentLesson && (
                <Link
                  href={`/learn/${trackConfig.id}/${currentLesson.id}`}
                  className="db-primary-btn font-dm-sans"
                >
                  {hasStarted ? "Continue →" : "Start track →"}
                </Link>
              )}
            </div>

            {/* Description */}
            <p
              className="font-dm-sans"
              style={{
                fontSize: "13px",
                fontWeight: 300,
                color: "var(--text-dim)",
                lineHeight: 1.7,
                maxWidth: "520px",
                marginBottom: "18px",
              }}
            >
              {trackConfig.description}
            </p>

            {/* Progress bar (only if not soon) */}
            {!trackConfig.soon && progress && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "240px",
                    height: "2px",
                    background: "#1d1d1d",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: trackConfig.gradient,
                      borderRadius: "2px",
                      transition: "width 0.4s",
                    }}
                  />
                </div>
                <span
                  className="font-dm-sans"
                  style={{ fontSize: "11px", color: "#3a3a3a" }}
                >
                  {progress.done} / {progress.total} lessons · {pct}%
                </span>
              </div>
            )}
          </div>

          {/* Coming soon state */}
          {trackConfig.soon ? (
            <div
              className="lrn-fade-up-slow"
              style={{ paddingTop: "40px", paddingBottom: "40px" }}
            >
              <div className="lrn-soon-pill font-dm-sans" />
              <h2
                className="font-syne"
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#222222",
                  letterSpacing: "-0.01em",
                  marginBottom: "12px",
                }}
              >
                This track is on its way.
              </h2>
              <p
                className="font-dm-sans"
                style={{
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#2a2a2a",
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
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {phases.map((phase) => (
                <div key={phase.label}>
                  <p
                    className="font-dm-sans"
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#555555",
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
        {/* end max-width wrapper */}
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
    maxWidth: "100%",
    boxSizing: "border-box",
    ...(lesson.state === "current"
      ? {
          background: "var(--bg-active-lesson)",
          borderColor: "var(--border-active)",
        }
      : {}),
  };

  const titleColor =
    lesson.state === "current"
      ? "var(--text-primary)"
      : lesson.state === "done"
        ? "#666666"
        : "#aaaaaa";

  const metaColor =
    lesson.state === "current"
      ? "#3a5a80"
      : lesson.state === "done"
        ? "#444444"
        : "#666666";

  const timeColor =
    lesson.state === "current"
      ? "#3a5a80"
      : lesson.state === "done"
        ? "#444444"
        : "#666666";

  const inner = (
    <>
      <StatusCircle state={lesson.state} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="font-dm-sans"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: titleColor,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {lesson.title}
        </p>
        <p
          className="font-dm-sans"
          style={{
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
          className="font-dm-sans"
          style={{
            fontSize: "11px",
            color: timeColor,
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
      <div className={`lrn-row lrn-row-locked`} style={rowStyle}>
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
            stroke="#22c55e"
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
            background: "#3b82f6",
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
            background: "#2a2a2a",
          }}
        />
      </div>
    );
  }

  // locked
  return (
    <div className="lrn-circle">
      <div className="lrn-lock" />
    </div>
  );
}
