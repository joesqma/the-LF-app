import { redirect } from "next/navigation";
import { PageShell } from "~/components/layout/PageShell";
import type { ProfileStats } from "~/components/profile/ProfileClient";
import { ProfileClient } from "~/components/profile/ProfileClient";
import { createClient } from "~/lib/supabase/server";

type SolveRow = { time_ms: number; penalty: string | null };

function computeBestAo(solves: SolveRow[], window: number): number | null {
  if (solves.length < window) return null;
  const values = solves.map((s) =>
    s.penalty === "dnf" ? Number.POSITIVE_INFINITY : s.time_ms,
  );
  let best: number | null = null;
  for (let i = 0; i <= values.length - window; i++) {
    const slice = [...values.slice(i, i + window)].sort((a, b) => a - b);
    const trimmed = slice.slice(1, slice.length - 1);
    const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    if (Number.isFinite(avg) && (best === null || avg < best)) {
      best = Math.round(avg);
    }
  }
  return best;
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, solvesResult, sessionsResult] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("solves")
      .select("time_ms, penalty")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("solve_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const profile = profileResult.data;
  const solves = solvesResult.data ?? [];
  const totalSessions = sessionsResult.count ?? 0;

  const nonDnf = solves.filter((s) => s.penalty !== "dnf");
  const bestSingle =
    nonDnf.length > 0 ? Math.min(...nonDnf.map((s) => s.time_ms)) : null;

  const stats: ProfileStats = {
    totalSolves: solves.length,
    bestSingle,
    bestAo5: computeBestAo(solves, 5),
    bestAo12: computeBestAo(solves, 12),
    totalSessions,
    memberSince:
      profile?.created_at ?? user.created_at ?? new Date().toISOString(),
  };

  return (
    <PageShell title="Profile">
      <ProfileClient
        user={{ id: user.id, email: user.email ?? "" }}
        profile={profile ?? null}
        stats={stats}
      />
    </PageShell>
  );
}
