import Link from "next/link";
import { redirect } from "next/navigation";
import type { TrackId } from "~/lib/content/tracks";
import { getTrackProgress, TRACKS } from "~/lib/content/tracks";
import { createClient } from "~/lib/supabase/server";

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

export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileResult = await supabase
    .from("user_profiles")
    .select("completed_lessons")
    .eq("id", user.id)
    .single();

  const completedIds = new Set<string>(
    (profileResult.data?.completed_lessons as string[] | null) ?? [],
  );

  const trackProgress = Object.fromEntries(
    TRACKS.filter((t) => !t.soon).map((t) => [
      t.id,
      getTrackProgress(t.id as TrackId, completedIds),
    ]),
  );

  return (
    <div
      style={{
        padding: "32px 36px 60px",
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <p
        style={{
          ...mono,
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--blue)",
          marginBottom: "6px",
        }}
      >
        Learn
      </p>
      <h1
        style={{
          ...sans,
          fontSize: "28px",
          fontWeight: 700,
          letterSpacing: "-0.8px",
          lineHeight: 1.1,
          color: "var(--t1)",
          marginBottom: "4px",
        }}
      >
        Choose your track
      </h1>
      <p
        style={{
          ...sans,
          fontSize: "13.5px",
          color: "var(--t2)",
          lineHeight: 1.5,
          marginBottom: "28px",
        }}
      >
        Pick a learning path to browse lessons and track your progress.
      </p>

      {/* Horizontal scroll track cards */}
      <div className="lrn-track-scroll" style={{ marginBottom: "24px" }}>
        {TRACKS.map((track) => {
          const prog = !track.soon ? trackProgress[track.id] : null;
          const accent = TRACK_ACCENT[track.id];
          const accentDim = TRACK_ACCENT_DIM[track.id];
          const pct =
            prog && prog.total > 0
              ? Math.round((prog.done / prog.total) * 100)
              : 0;
          const isComplete = prog
            ? prog.done === prog.total && prog.total > 0
            : false;

          const inner = (
            <div
              className={[
                "lrn-track-card",
                track.soon ? "lrn-track-card-soon" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* 2px accent top bar */}
              <div
                aria-hidden="true"
                style={{
                  height: "2px",
                  flexShrink: 0,
                  background: accent ?? "var(--b2)",
                }}
              />

              {/* Card body */}
              <div
                style={{
                  padding: "14px 16px 16px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
                {/* Emoji + name row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "22px",
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    {track.emoji}
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
                      {track.name}
                    </p>
                    {track.soon && (
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

                {/* Description */}
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
                  {track.description}
                </p>

                {/* Progress (active tracks only) */}
                {!track.soon && prog && prog.total > 0 && (
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
                          color: isComplete
                            ? "var(--green)"
                            : accentDim
                              ? accent
                              : "var(--t3)",
                        }}
                      >
                        {isComplete ? "Complete ✓" : `${pct}%`}
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
                          background: isComplete
                            ? "var(--green)"
                            : (accent ?? "var(--blue)"),
                          borderRadius: "2px",
                          width: `${pct}%`,
                          transition: "width 300ms",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* No-progress nudge for active tracks with 0 lessons tracked */}
                {!track.soon && (!prog || prog.total === 0) && (
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
            </div>
          );

          if (track.soon) {
            return <div key={track.id}>{inner}</div>;
          }

          return (
            <Link key={track.id} href={`/learn/${track.id}`}>
              {inner}
            </Link>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid var(--b2)", marginBottom: "36px" }} />

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            ...sans,
            fontSize: "15px",
            fontWeight: 400,
            color: "var(--t3)",
          }}
        >
          Select a track to get started.
        </p>
      </div>
    </div>
  );
}
