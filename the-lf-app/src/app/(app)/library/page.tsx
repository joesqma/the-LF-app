import { redirect } from "next/navigation";
import { PageShell } from "~/components/layout/PageShell";
import { SavedScramblesSection } from "~/components/library/SavedScramblesSection";
import { createClient } from "~/lib/supabase/server";
import type { Bookmark, SavedScramble } from "~/types/database";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: bookmarkData }, { data: scrambleData }] = await Promise.all([
    supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_scrambles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const bookmarks: Bookmark[] = bookmarkData ?? [];
  const savedScrambles: SavedScramble[] = scrambleData ?? [];

  return (
    <PageShell title="Library" subtitle="Saved videos and scrambles.">
      <div className="flex flex-col gap-8">
        {/* Saved scrambles */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Scrambles</h2>
          <SavedScramblesSection initialScrambles={savedScrambles} />
        </section>

        {/* Saved videos */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Videos</h2>
          {bookmarks.length === 0 ? (
            <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                No saved videos yet. Bookmark lessons or analysis clips to find
                them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {bookmarks.map((b) => {
                const tag = b.topic_tag ?? b.method_tag;
                return (
                  <div
                    key={b.id}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      {b.source && (
                        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                          {b.source}
                        </span>
                      )}
                      {tag && (
                        <span className="inline-flex shrink-0 items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
                          {tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {b.title}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
