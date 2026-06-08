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

const CELLS = [
  { key: "ao5", label: "AO5", sub: "last 5 solves", accent: "var(--blue)" },
  { key: "ao12", label: "AO12", sub: "last 12 solves", accent: "var(--teal)" },
  {
    key: "total",
    label: "Total solves",
    sub: "all time",
    accent: "var(--purple)",
  },
  {
    key: "days",
    label: "Days active",
    sub: "past year",
    accent: "var(--orange)",
  },
] as const;

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export function QuickStatsBlock({
  recentSolves,
  totalSolves,
  daysActive,
}: Props) {
  if (totalSolves === 0) return null;

  const ao5 = computeAo(recentSolves, 5);
  const ao12 = computeAo(recentSolves, 12);

  const values: Record<string, string> = {
    ao5,
    ao12,
    total: totalSolves.toLocaleString(),
    days: daysActive.toLocaleString(),
  };

  return (
    <div>
      <p
        style={{
          ...mono,
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--t3)",
          marginBottom: "12px",
        }}
      >
        Quick stats
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          background: "var(--s1)",
          border: "0.5px solid var(--b2)",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {CELLS.map(({ key, label, sub, accent }, i) => (
          <div
            key={key}
            style={{
              position: "relative",
              padding: "20px 22px",
              borderRight:
                i < CELLS.length - 1 ? "0.5px solid var(--b1)" : undefined,
            }}
          >
            {/* Accent top bar */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: accent,
              }}
            />

            <div
              style={{
                ...mono,
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: "var(--t3)",
                marginBottom: "10px",
                marginTop: "2px",
              }}
            >
              {label}
            </div>

            <div
              style={{
                ...mono,
                fontSize: "30px",
                fontWeight: 700,
                letterSpacing: "-1px",
                lineHeight: 1,
                color: accent,
              }}
            >
              {values[key]}
            </div>

            <div
              style={{
                ...sans,
                fontSize: "11px",
                fontWeight: 400,
                color: "var(--t3)",
                marginTop: "5px",
              }}
            >
              {sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
