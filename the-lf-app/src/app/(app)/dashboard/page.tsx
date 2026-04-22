import { BookOpen, Timer, Video } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "~/components/layout/PageShell";
import { createClient } from "~/lib/supabase/server";
import { formatTime } from "~/utils/timer";

type SolveRow = { time_ms: number; penalty: string | null; created_at: string };

function computeCurrentAo(solves: SolveRow[], n: number): number | null {
  if (solves.length < n) return null;
  const slice = solves.slice(0, n);
  const values = slice.map((s) =>
    s.penalty === "dnf" ? Number.POSITIVE_INFINITY : s.time_ms,
  );
  const sorted = [...values].sort((a, b) => a - b).slice(1, -1);
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  return Number.isFinite(avg) ? Math.round(avg) : null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, solvesResult] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("solves")
      .select("time_ms, penalty, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const displayName =
    profileResult.data?.display_name ?? user.email?.split("@")[0] ?? "there";
  const firstName = displayName.split(" ")[0];
  const solves: SolveRow[] = solvesResult.data ?? [];

  const ao5 = computeCurrentAo(solves, 5);
  const ao12 = computeCurrentAo(solves, 12);
  const totalSolves = solves.length;
  const distinctDays = new Set(
    solves.map((s) => {
      const d = new Date(s.created_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  ).size;

  const stats = [
    { label: "Current Ao5", value: ao5 != null ? formatTime(ao5) : "—" },
    { label: "Current Ao12", value: ao12 != null ? formatTime(ao12) : "—" },
    {
      label: "Total solves",
      value: totalSolves > 0 ? totalSolves.toLocaleString() : "—",
    },
    {
      label: "Days active",
      value: distinctDays > 0 ? String(distinctDays) : "—",
    },
  ];

  const shortcuts = [
    { href: "/timer", icon: Timer, label: "Open timer" },
    { href: "/analysis", icon: Video, label: "New analysis" },
    { href: "/learn", icon: BookOpen, label: "Browse lessons" },
  ];

  return (
    <PageShell
      title={`Welcome back, ${firstName}.`}
      subtitle="Pick up where you left off — or start a new analysis."
    >
      {/* Recommended lesson */}
      <div className="mb-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-2 flex items-start justify-between">
          <span className="inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
            Recommended for you
          </span>
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            CFOP · ~12 min
          </span>
        </div>
        <h3 className="mb-1.5 mt-2 text-xl font-semibold tracking-tight text-foreground">
          F2L lookahead drills
        </h3>
        <p className="text-sm text-muted-foreground">
          Improves your ability to spot the next F2L pair while executing the
          current one — the single highest-leverage drill for intermediate
          solvers.
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/learn"
            className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Start lesson
          </Link>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Save for later
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick navigation */}
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Quick navigation
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {shortcuts.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:bg-accent"
          >
            <Icon className="h-6 w-6 shrink-0 text-foreground" />
            <span className="text-base font-medium text-foreground">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
