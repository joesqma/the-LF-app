import { Activity, CalendarDays, Gauge, Layers3 } from "lucide-react";

type SolveStat = {
  time_ms: number;
  penalty: "dnf" | "+2" | null;
};

interface Props {
  recentSolves: SolveStat[];
  totalSolves: number;
  daysActive: number;
}

function fmtMs(ms: number): string {
  const s = ms / 1000;
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(2).padStart(5, "0");
    return `${m}:${sec}`;
  }
  return s.toFixed(2);
}

function computeAo(solves: SolveStat[], n: number): string {
  if (solves.length < n) return "—";
  const times = solves.slice(0, n).map((solve) => {
    if (solve.penalty === "dnf") return Infinity;
    return solve.time_ms + (solve.penalty === "+2" ? 2000 : 0);
  });
  if (times.filter((time) => time === Infinity).length >= 2) return "DNF";
  const middle = [...times].sort((a, b) => a - b).slice(1, n - 1);
  if (middle.includes(Infinity)) return "DNF";
  return fmtMs(middle.reduce((sum, time) => sum + time, 0) / middle.length);
}

export function QuickStatsBlock({
  recentSolves,
  totalSolves,
  daysActive,
}: Props) {
  if (totalSolves === 0) return null;

  const stats = [
    {
      label: "Current Ao5",
      value: computeAo(recentSolves, 5),
      note: "Last five solves",
      Icon: Gauge,
    },
    {
      label: "Current Ao12",
      value: computeAo(recentSolves, 12),
      note: "Last twelve solves",
      Icon: Activity,
    },
    {
      label: "Total solves",
      value: totalSolves.toLocaleString(),
      note: "All sessions",
      Icon: Layers3,
    },
    {
      label: "Active days",
      value: daysActive.toLocaleString(),
      note: "This past year",
      Icon: CalendarDays,
    },
  ];

  return (
    <section className="dashboard-section stats-section">
      <div className="dashboard-section__heading dashboard-section__heading--compact">
        <div>
          <span className="dashboard-kicker">Momentum</span>
          <h2>Your pace at a glance</h2>
        </div>
      </div>
      <div className="soft-stat-grid">
        {stats.map(({ label, value, note, Icon }) => (
          <article key={label} className="soft-stat">
            <div className="soft-stat__label">
              <Icon size={16} />
              <span>{label}</span>
            </div>
            <strong>{value}</strong>
            <p>{note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
