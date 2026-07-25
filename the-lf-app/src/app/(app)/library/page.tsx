import { Bookmark, ScanSearch, Shuffle } from "lucide-react";
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
      .from("saved_scrambles")
      .select("id, scramble, puzzle, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const analyses = analysisData ?? [];
  const bookmarks = bookmarkData ?? [];
  const scrambles = scrambleData ?? [];

  const totals = [
    { label: "Analyses", value: analyses.length, Icon: ScanSearch },
    { label: "Videos", value: bookmarks.length, Icon: Bookmark },
    { label: "Scrambles", value: scrambles.length, Icon: Shuffle },
  ];

  return (
    <div className="library-page">
      <header className="library-hero">
        <div className="library-hero__copy">
          <span className="library-eyebrow">Library</span>
          <h1>Keep what moves you forward.</h1>
          <p>
            Your analyses, saved lessons, and useful scrambles in one place.
          </p>
        </div>
        <section className="library-totals" aria-label="Library totals">
          {totals.map(({ label, value, Icon }) => (
            <div key={label} className="library-total">
              <Icon size={16} />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>
      </header>

      <LibraryClient
        analyses={analyses}
        bookmarks={bookmarks}
        scrambles={scrambles}
      />
    </div>
  );
}
