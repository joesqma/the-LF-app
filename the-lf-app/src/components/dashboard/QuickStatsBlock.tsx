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
  const last = solves.slice(0, n);
  const times = last.map((s) => {
    if (s.penalty === "dnf") return Infinity;
    if (s.penalty === "+2") return s.time_ms + 2000;
    return s.time_ms;
  });
  const dnfCount = times.filter((t) => t === Infinity).length;
  if (dnfCount >= 2) return "DNF";
  const sorted = [...times].sort((a, b) => a - b);
  const middle = sorted.slice(1, n - 1);
  const hasDnf = middle.includes(Infinity);
  if (hasDnf) return "DNF";
  const avg = middle.reduce((a, b) => a + b, 0) / middle.length;
  return fmtMs(avg);
}

export function QuickStatsBlock({
  recentSolves,
  totalSolves,
  daysActive,
}: Props) {
  if (totalSolves === 0) return null;

  const ao5 = computeAo(recentSolves, 5);
  const ao12 = computeAo(recentSolves, 12);

  const stats = [
    { label: "Ao5", value: ao5 },
    { label: "Ao12", value: ao12 },
    { label: "Total solves", value: totalSolves.toLocaleString() },
    { label: "Days active", value: daysActive.toLocaleString() },
  ];

  return (
    <div style={{ marginTop: "40px", marginBottom: "40px" }}>
      <p
        className="font-dm-sans"
        style={{
          fontSize: "11px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-dimmer)",
          marginBottom: "16px",
        }}
      >
        Quick stats
      </p>
      <div
        style={{
          display: "flex",
          gap: "1px",
          background: "var(--border)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {stats.map(({ label, value }) => (
          <div
            key={label}
            style={{
              flex: 1,
              background: "var(--bg-card)",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span
              className="font-mono tabular-nums"
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {value}
            </span>
            <span
              className="font-dm-sans"
              style={{
                fontSize: "11px",
                fontWeight: 300,
                color: "var(--text-dimmer)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
