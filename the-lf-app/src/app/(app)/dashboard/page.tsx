import { redirect } from "next/navigation";
import { DontKnowCTA } from "~/components/dashboard/DontKnowCTA";
import { QuickNavGrid } from "~/components/dashboard/QuickNavGrid";
import { QuickStatsBlock } from "~/components/dashboard/QuickStatsBlock";
import { RecommendedLessonCard } from "~/components/dashboard/RecommendedLessonCard";
import { getRecommendedLesson } from "~/lib/recommendations";
import { createClient } from "~/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const [
    profileResult,
    analysisResult,
    recentSolvesResult,
    totalSolvesResult,
    datesResult,
    analysisCountResult,
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name, method, completed_lessons, knows_how_to_solve")
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
    supabase
      .from("solves")
      .select("time_ms, penalty")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("solves")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("solves")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", yearAgo.toISOString()),
    supabase
      .from("analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const profile = profileResult.data;
  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "there";
  const firstName = displayName.split(" ")[0] ?? displayName;

  const recentSolves = recentSolvesResult.data ?? [];
  const totalSolves = totalSolvesResult.count ?? 0;
  const daysActive = new Set(
    (datesResult.data ?? []).map((s) => s.created_at.slice(0, 10)),
  ).size;
  const analysisCount = analysisCountResult.count ?? 0;

  const completedLessons =
    (profile?.completed_lessons as string[] | null) ?? [];
  const showDontKnowCTA = completedLessons.length === 0 && analysisCount === 0;

  // "Don't know where to start?" destination — uses onboarding answers
  const dontKnowHref =
    profile?.knows_how_to_solve === false
      ? "/learn/cfop/cfop-cross-1"
      : "/learn";

  const recommended = profile
    ? getRecommendedLesson({
        profile: {
          knows_how_to_solve: profile.knows_how_to_solve ?? false,
          method: profile.method ?? null,
          completed_lessons: profile.completed_lessons,
          cfop_level: null,
        },
        recentAnalysis: analysisResult.data,
        analysisCount,
        totalSolves,
      })
    : null;

  return (
    <div
      className="py-6 px-5 md:py-[48px] md:px-[56px]"
      style={{
        background: "var(--bg-base)",
        flex: 1,
        overflowY: "auto",
        minWidth: 0,
      }}
    >
      {/* Greeting */}
      <div style={{ marginBottom: "48px" }}>
        <p
          className="font-dm-sans"
          style={{
            fontSize: "13px",
            fontWeight: 400,
            color: "var(--text-dimmer)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Dashboard
        </p>
        <h1
          className="font-syne text-[28px] md:text-[38px]"
          style={{
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Welcome back, {firstName}.
        </h1>
      </div>

      {/* AI Recommendation */}
      {recommended && (
        <RecommendedLessonCard
          recommendation={recommended}
          dontKnowHref={dontKnowHref}
        />
      )}

      {/* Quick navigation */}
      <QuickNavGrid />

      {/* Don't know CTA */}
      {showDontKnowCTA && (
        <DontKnowCTA knowsHowToSolve={profile?.knows_how_to_solve ?? false} />
      )}

      {/* Quick stats — bottom of page */}
      <QuickStatsBlock
        recentSolves={recentSolves}
        totalSolves={totalSolves}
        daysActive={daysActive}
      />
    </div>
  );
}
