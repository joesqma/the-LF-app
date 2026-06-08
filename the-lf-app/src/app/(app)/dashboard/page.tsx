import { redirect } from "next/navigation";
import { QuickNavGrid } from "~/components/dashboard/QuickNavGrid";
import { QuickStatsBlock } from "~/components/dashboard/QuickStatsBlock";
import { RecentAnalysis } from "~/components/dashboard/RecentAnalysis";
import { RecommendedLessonCard } from "~/components/dashboard/RecommendedLessonCard";
import { getRecommendedLesson } from "~/lib/recommendations";
import { createClient } from "~/lib/supabase/server";
import type { AnalysisReport } from "~/types/analysis";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

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
    recentAnalysesResult,
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
    supabase
      .from("analyses")
      .select("id, method, created_at, report")
      .eq("user_id", user.id)
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .limit(5),
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

  const recentAnalyses = (recentAnalysesResult.data ?? []).map((a) => ({
    id: a.id,
    method: a.method,
    created_at: a.created_at,
    report: (a.report as unknown as AnalysisReport | null) ?? null,
  }));

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
    <div style={{ padding: "28px 32px 48px" }}>
      {/* Hero */}
      <div style={{ marginBottom: "28px" }}>
        <p
          style={{
            ...mono,
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "2px",
            color: "var(--t3)",
            marginBottom: "8px",
          }}
        >
          Overview
        </p>
        <h1
          style={{
            ...sans,
            fontSize: "38px",
            fontWeight: 700,
            letterSpacing: "-1.5px",
            lineHeight: 1.05,
            color: "var(--t1)",
          }}
        >
          Welcome back,{" "}
          <span style={{ color: "var(--blue)" }}>{firstName}.</span>
        </h1>
      </div>

      {/* AI Recommendation */}
      {recommended && (
        <div style={{ marginBottom: "28px" }}>
          <RecommendedLessonCard
            recommendation={recommended}
            dontKnowHref={dontKnowHref}
          />
        </div>
      )}

      {/* Quick navigation */}
      <div style={{ marginBottom: "28px" }}>
        <QuickNavGrid />
      </div>

      {/* Quick stats */}
      {totalSolves > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <QuickStatsBlock
            recentSolves={recentSolves}
            totalSolves={totalSolves}
            daysActive={daysActive}
          />
        </div>
      )}

      {/* Recent analysis */}
      {recentAnalyses.length > 0 && (
        <RecentAnalysis analyses={recentAnalyses} />
      )}
    </div>
  );
}
