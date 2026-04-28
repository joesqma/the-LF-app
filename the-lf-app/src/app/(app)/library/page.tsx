import { redirect } from "next/navigation";
import { LibraryClient } from "~/components/library/LibraryClient";
import { createClient } from "~/lib/supabase/server";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: analysisData },
    { data: bookmarkData },
    { data: scrambleData },
  ] = await Promise.all([
    supabase
      .from("analyses")
      .select("id, method, status, report, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookmarks")
      .select("id, video_url, title, source, topic_tag, method_tag")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("solves")
      .select("id, scramble, created_at, session_id")
      .eq("user_id", user.id)
      .not("scramble", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const analyses = analysisData ?? [];
  const bookmarks = bookmarkData ?? [];

  // Deduplicate scrambles — same string keeps most recent occurrence (data is DESC)
  const seen = new Set<string>();
  const scrambles: Array<{
    id: string;
    scramble: string;
    created_at: string;
    session_id: string;
  }> = [];
  for (const s of scrambleData ?? []) {
    if (s.scramble && !seen.has(s.scramble)) {
      seen.add(s.scramble);
      scrambles.push(s as (typeof scrambles)[0]);
    }
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-base)",
        overflow: "hidden",
      }}
    >
      {/* Page header */}
      <div
        style={{
          padding: "48px 56px 40px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <p
          className="font-dm-sans"
          style={{
            fontSize: "11px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-dimmer)",
            marginBottom: "8px",
          }}
        >
          Library
        </p>
        <h1
          className="font-syne"
          style={{
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          Your collection.
        </h1>
        <p
          className="font-dm-sans"
          style={{
            fontSize: "13px",
            fontWeight: 300,
            color: "var(--text-dim)",
          }}
        >
          Analyses, saved videos, and scrambles — all in one place.
        </p>
      </div>

      <LibraryClient
        analyses={analyses}
        bookmarks={bookmarks}
        scrambles={scrambles}
      />
    </div>
  );
}
