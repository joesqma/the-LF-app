import { redirect } from "next/navigation";
import { QuickNavGrid } from "~/components/dashboard/QuickNavGrid";
import { RecommendedLessonCard } from "~/components/dashboard/RecommendedLessonCard";
import { getRecommendedLesson } from "~/lib/content/recommended";
import { createClient } from "~/lib/supabase/server";
import type { AnalysisReport } from "~/types/analysis";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, analysisResult] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name, method, completed_lessons")
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

  const profile = profileResult.data;
  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "there";
  const firstName = displayName.split(" ")[0] ?? displayName;

  const completedLessons =
    (profile?.completed_lessons as string[] | null) ?? [];
  const analysisReport = analysisResult.data
    ?.report as unknown as AnalysisReport | null;

  const recommendedLesson = getRecommendedLesson(
    profile?.method ?? null,
    completedLessons,
    analysisReport?.recommended_lesson_ids,
  );

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

      {/* Recommended lesson */}
      {recommendedLesson && (
        <RecommendedLessonCard lesson={recommendedLesson} />
      )}

      {/* Quick navigation */}
      <QuickNavGrid />
    </div>
  );
}
