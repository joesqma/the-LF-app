import { redirect } from "next/navigation";
import { StatsClient } from "~/components/stats/StatsClient";
import { createClient } from "~/lib/supabase/server";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: solves }, { data: sessions }] = await Promise.all([
    supabase
      .from("solves")
      .select("id, time_ms, penalty, session_id, created_at, method")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("solve_sessions")
      .select("id, name, puzzle, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return <StatsClient allSolves={solves ?? []} sessions={sessions ?? []} />;
}
