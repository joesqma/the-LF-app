import { redirect } from "next/navigation";
import { PageShell } from "~/components/layout/PageShell";
import { TrackCard } from "~/components/learn/TrackCard";
import { cfopLessons } from "~/lib/content/cfop";
import { compPrepLessons } from "~/lib/content/comp-prep";
import { rouxLessons } from "~/lib/content/roux";
import { createClient } from "~/lib/supabase/server";

export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("completed_lessons")
    .eq("id", user.id)
    .single();

  const completed = (profile?.completed_lessons as string[] | null) ?? [];

  const cfopCompleted = cfopLessons.filter((l) =>
    completed.includes(l.id),
  ).length;
  const rouxCompleted = rouxLessons.filter((l) =>
    completed.includes(l.id),
  ).length;
  const compCompleted = compPrepLessons.filter((l) =>
    completed.includes(l.id),
  ).length;

  return (
    <PageShell
      title="Learn"
      subtitle="Three structured tracks. Pick where you are and start."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TrackCard
          href="/learn/cfop"
          name="CFOP"
          description="The most popular speedsolving method. Master Cross, F2L, OLL, and PLL to break into sub-20."
          icon="⚡"
          lessonCount={cfopLessons.length}
          completedCount={cfopCompleted}
        />
        <TrackCard
          href="/learn/roux"
          name="Roux"
          description="A block-building method with a low move count. Preferred by many sub-10 solvers worldwide."
          icon="🧱"
          lessonCount={rouxLessons.length}
          completedCount={rouxCompleted}
        />
        <TrackCard
          href="/learn/comp-prep"
          name="Competition Prep"
          description="Scorecards, penalties, warm-up routines, and the mental side of competing at WCA events."
          icon="🏆"
          lessonCount={compPrepLessons.length}
          completedCount={compCompleted}
        />
      </div>
    </PageShell>
  );
}
