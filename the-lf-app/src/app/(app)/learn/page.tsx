import Link from "next/link";
import { redirect } from "next/navigation";
import type { TrackId } from "~/lib/content/tracks";
import { getTrackProgress, TRACKS } from "~/lib/content/tracks";
import { createClient } from "~/lib/supabase/server";

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
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        background: "var(--bg-base)",
      }}
    >
      {/* Page header */}
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

      {/* Track switcher — nothing active */}
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
              >
                <span style={{ fontSize: "13px" }}>{t.emoji}</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--text-dim)",
                  }}
                >
                  {t.name}
                </span>
                {!t.soon && prog && prog.total > 0
                  ? (() => {
                      const complete = prog.done === prog.total;
                      return (
                        <span
                          className="font-dm-sans"
                          style={{
                            fontSize: "10px",
                            padding: "1px 6px",
                            borderRadius: "20px",
                            color: complete ? "#22c55e" : "var(--text-dimmer)",
                            background: complete ? "#0d2a18" : "#161616",
                            border: `1px solid ${complete ? "#14532d" : "#1d1d1d"}`,
                          }}
                        >
                          {complete ? "✓" : `${prog.done}/${prog.total}`}
                        </span>
                      );
                    })()
                  : null}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          margin: "20px 24px 0",
          height: "1px",
          flexShrink: 0,
          background: "var(--border-default)",
        }}
      />

      {/* Default empty state */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "28px",
          padding: "60px 24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "360px" }}>
          <h2
            className="font-syne"
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
              marginBottom: "10px",
            }}
          >
            Where do you want to improve?
          </h2>
          <p
            className="font-dm-sans"
            style={{
              fontSize: "13px",
              fontWeight: 300,
              color: "var(--text-dim)",
              lineHeight: 1.7,
            }}
          >
            Pick a track above to browse lessons, or head to Training for
            structured drills and practice plans.
          </p>
        </div>
      </div>
    </div>
  );
}
