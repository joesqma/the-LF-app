"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface SolveRow {
  id: string;
  time_ms: number;
  penalty: "dnf" | "+2" | null;
  session_id: string;
  created_at: string;
  method: string | null;
}
interface SessionRow {
  id: string;
  name: string;
  puzzle: string;
  created_at: string;
}
interface Props {
  allSolves: SolveRow[];
  sessions: SessionRow[];
}

// ── Stat helpers ──────────────────────────────────────────────────────────────
function effTime(s: SolveRow): number {
  if (s.penalty === "dnf") return Infinity;
  return s.penalty === "+2" ? s.time_ms + 2000 : s.time_ms;
}
function fmt(ms: number): string {
  if (!Number.isFinite(ms)) return "DNF";
  const s = ms / 1000;
  if (s < 60) return s.toFixed(2);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toFixed(2).padStart(5, "0")}`;
}
function calcAo(times: number[], n: number): number | null {
  if (times.length < n) return null;
  const w = [...times.slice(-n)].sort((a, b) => a - b);
  const trimmed = w.slice(1, -1);
  if (trimmed.some((t) => t === Infinity)) return Infinity;
  return trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
}
function bestRolling(
  times: number[],
  n: number,
): { value: number; windowTimes: number[]; endIndex: number } | null {
  if (times.length < n) return null;
  let best = Infinity;
  let bestEnd = -1;
  for (let i = n - 1; i < times.length; i++) {
    const w = times.slice(i - n + 1, i + 1);
    const sorted = [...w].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1);
    if (trimmed.some((t) => t === Infinity)) continue;
    const ao = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
    if (ao < best) {
      best = ao;
      bestEnd = i;
    }
  }
  if (best === Infinity || bestEnd < 0) return null;
  return {
    value: best,
    windowTimes: times.slice(bestEnd - n + 1, bestEnd + 1),
    endIndex: bestEnd,
  };
}
function median(times: number[]): number | null {
  const v = times.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 === 0 ? (v[mid - 1] + v[mid]) / 2 : v[mid];
}
function stdDev(times: number[]): number | null {
  const v = times.filter(Number.isFinite);
  if (v.length < 2) return null;
  const mean = v.reduce((s, x) => s + x, 0) / v.length;
  return Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length);
}
function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Canvas draw helpers ───────────────────────────────────────────────────────
const C_PAD = { top: 14, right: 20, bottom: 28, left: 44 };

type SeriesKey = "raw" | "mo3" | "ao5" | "ao12" | "ao100";

const SERIES_ORDER: SeriesKey[] = ["raw", "mo3", "ao5", "ao12", "ao100"];

const SERIES_META: Record<
  SeriesKey,
  {
    label: string;
    color: string;
    shadow: string;
    minSolves: number;
    lineWidth: number;
  }
> = {
  raw: {
    label: "Raw",
    color: "#00a8ff",
    shadow: "rgba(0,168,255,0.3)",
    minSolves: 1,
    lineWidth: 1.5,
  },
  mo3: {
    label: "Mo3",
    color: "#f59e0b",
    shadow: "rgba(245,158,11,0.3)",
    minSolves: 3,
    lineWidth: 1.5,
  },
  ao5: {
    label: "Ao5",
    color: "#16c95a",
    shadow: "rgba(22,201,90,0.3)",
    minSolves: 5,
    lineWidth: 2,
  },
  ao12: {
    label: "Ao12",
    color: "#a855f7",
    shadow: "rgba(168,85,247,0.3)",
    minSolves: 12,
    lineWidth: 2,
  },
  ao100: {
    label: "Ao100",
    color: "#ef4444",
    shadow: "rgba(239,68,68,0.3)",
    minSolves: 100,
    lineWidth: 2.5,
  },
};

function drawTrend(
  canvas: HTMLCanvasElement,
  times: number[],
  activeSeries: Set<SeriesKey>,
  smooth: boolean,
) {
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.offsetWidth;
  const ch = 160;
  if (!cw) return;
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const canvasW = cw;
  const chartW = canvasW - C_PAD.left - C_PAD.right;
  const chartH = ch - C_PAD.top - C_PAD.bottom;

  const valid = times.filter(Number.isFinite);
  if (valid.length < 2) return;

  const minT = Math.min(...valid);
  const maxT = Math.max(...valid);
  const range = maxT - minT || 1000;

  const xOf = (i: number) =>
    C_PAD.left + (i / Math.max(times.length - 1, 1)) * chartW;
  const yOf = (t: number) =>
    C_PAD.top + chartH - ((Math.min(t, maxT) - minT) / range) * chartH;

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = C_PAD.top + (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(C_PAD.left, y);
    ctx.lineTo(canvasW - C_PAD.right, y);
    ctx.stroke();
  }

  // Y labels
  ctx.font = "10px 'Geist Mono', monospace";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const t = minT + ((4 - i) / 4) * range;
    const y = C_PAD.top + (i / 4) * chartH;
    ctx.fillText(`${(t / 1000).toFixed(1)}s`, C_PAD.left - 6, y);
  }

  // X labels
  const labelCt = Math.min(6, times.length);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < labelCt; i++) {
    const idx = Math.round((i / Math.max(labelCt - 1, 1)) * (times.length - 1));
    ctx.fillText(`#${idx + 1}`, xOf(idx), ch - C_PAD.bottom + 4);
  }

  type Pt = { x: number; y: number };

  const drawLine = (pts: Pt[], color: string, shadow: string, lw: number) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.shadowColor = shadow;
    ctx.shadowBlur = 5;
    ctx.moveTo(pts[0].x, pts[0].y);
    if (smooth) {
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1],
          c = pts[i];
        const mx = (p.x + c.x) / 2;
        ctx.bezierCurveTo(mx, p.y, mx, c.y, c.x, c.y);
      }
    } else {
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const getRollingAvgPts = (n: number, trim: boolean): Pt[] => {
    const pts: Pt[] = [];
    for (let i = n - 1; i < times.length; i++) {
      const win = times.slice(i - n + 1, i + 1);
      if (trim) {
        const sorted = [...win].sort((a, b) => a - b).slice(1, -1);
        if (sorted.some((t) => !Number.isFinite(t))) continue;
        const ao = sorted.reduce((s, v) => s + v, 0) / sorted.length;
        pts.push({ x: xOf(i), y: yOf(ao) });
      } else {
        const validWin = win.filter(Number.isFinite);
        if (validWin.length !== n) continue;
        const mo = validWin.reduce((s, v) => s + v, 0) / validWin.length;
        pts.push({ x: xOf(i), y: yOf(mo) });
      }
    }
    return pts;
  };

  // Faint scatter dots when any avg series is active but raw is not
  const hasAvg = SERIES_ORDER.filter((k) => k !== "raw").some((k) =>
    activeSeries.has(k),
  );
  if (hasAvg && !activeSeries.has("raw")) {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < times.length; i++) {
      if (!Number.isFinite(times[i])) continue;
      ctx.beginPath();
      ctx.arc(xOf(i), yOf(times[i]), 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (activeSeries.has("raw")) {
    const m = SERIES_META.raw;
    const rawPts: Pt[] = [];
    for (let i = 0; i < times.length; i++) {
      if (Number.isFinite(times[i]))
        rawPts.push({ x: xOf(i), y: yOf(times[i]) });
    }
    drawLine(rawPts, m.color, m.shadow, m.lineWidth);
    ctx.fillStyle = "rgba(0,168,255,0.7)";
    for (const pt of rawPts) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (activeSeries.has("mo3") && times.length >= 3) {
    const m = SERIES_META.mo3;
    drawLine(getRollingAvgPts(3, false), m.color, m.shadow, m.lineWidth);
  }
  if (activeSeries.has("ao5") && times.length >= 5) {
    const m = SERIES_META.ao5;
    drawLine(getRollingAvgPts(5, true), m.color, m.shadow, m.lineWidth);
  }
  if (activeSeries.has("ao12") && times.length >= 12) {
    const m = SERIES_META.ao12;
    drawLine(getRollingAvgPts(12, true), m.color, m.shadow, m.lineWidth);
  }
  if (activeSeries.has("ao100") && times.length >= 100) {
    const m = SERIES_META.ao100;
    drawLine(getRollingAvgPts(100, true), m.color, m.shadow, m.lineWidth);
  }
}

function drawHist(canvas: HTMLCanvasElement, times: number[]) {
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.offsetWidth;
  const ch = 140;
  if (!cw) return;
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const w = cw;
  const chartW = w - C_PAD.left - C_PAD.right;
  const chartH = ch - C_PAD.top - C_PAD.bottom;

  const valid = times.filter(Number.isFinite);
  if (valid.length < 2) return;

  const minT = Math.min(...valid);
  const maxT = Math.max(...valid);
  const range = maxT - minT || 1000;
  const bins = new Array<number>(20).fill(0);
  for (const t of valid) {
    const bi = Math.min(Math.floor(((t - minT) / range) * 20), 19);
    bins[bi]++;
  }
  const maxBin = Math.max(...bins, 1);
  const binW = chartW / 20;

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = C_PAD.top + (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(C_PAD.left, y);
    ctx.lineTo(w - C_PAD.right, y);
    ctx.stroke();
  }

  // Y labels
  ctx.font = "10px 'Geist Mono', monospace";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const count = Math.round(((4 - i) / 4) * maxBin);
    const y = C_PAD.top + (i / 4) * chartH;
    ctx.fillText(count.toString(), C_PAD.left - 6, y);
  }

  // Bars
  for (let i = 0; i < 20; i++) {
    if (!bins[i]) continue;
    const x = C_PAD.left + i * binW + 1;
    const bh = (bins[i] / maxBin) * chartH;
    const y = C_PAD.top + chartH - bh;
    const bw = binW - 2;
    const g = ctx.createLinearGradient(x, y, x, y + bh);
    g.addColorStop(0, "rgba(0,168,255,0.65)");
    g.addColorStop(1, "rgba(0,168,255,0.08)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, bw, bh);
  }

  // X labels every 3 bins
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < 20; i += 3) {
    const t = minT + (i / 20) * range;
    const x = C_PAD.left + (i + 0.5) * binW;
    ctx.fillText(`${(t / 1000).toFixed(1)}s`, x, ch - C_PAD.bottom + 4);
  }

  // Median line
  const med = median(valid);
  if (med !== null && med >= minT && med <= maxT) {
    const mx = C_PAD.left + ((med - minT) / range) * chartW;
    ctx.beginPath();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.moveTo(mx, C_PAD.top);
    ctx.lineTo(mx, C_PAD.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "10px 'Outfit', sans-serif";
    ctx.fillStyle = "#f59e0b";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("median", mx, C_PAD.top - 2);
  }
}

// ── Font style objects ────────────────────────────────────────────────────────
const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  valueColor,
  valueSize = 28,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  valueSize?: number;
}) {
  return (
    <div className="st-stat-card">
      <p className="st-stat-label">{label}</p>
      <p
        className="st-stat-value"
        style={{ fontSize: valueSize, color: valueColor ?? "var(--t1)" }}
      >
        {value}
      </p>
      <p className="st-stat-sub">{sub}</p>
    </div>
  );
}

function PBCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="st-pb-card">
      <p className="st-pb-label">{label}</p>
      <p className="st-pb-value">{value}</p>
      <p className="st-pb-sub">{sub}</p>
    </div>
  );
}

function CurrCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="st-curr-card">
      <p className="st-curr-label">{label}</p>
      <p className="st-curr-value">{value}</p>
      <p className="st-curr-sub">{sub}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "9px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "2px",
        color: "var(--t3)",
        marginBottom: "12px",
      }}
    >
      {children}
    </p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function StatsClient({ allSolves, sessions }: Props) {
  const [sessionId, setSessionId] = useState<string>(sessions[0]?.id ?? "");
  const [activeSeries, setActiveSeries] = useState<Set<SeriesKey>>(
    () => new Set<SeriesKey>(["ao5"]),
  );
  const [smooth, setSmooth] = useState(true);

  const toggleSeries = (key: SeriesKey) => {
    setActiveSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sessionSolves = useMemo(
    () =>
      allSolves
        .filter((s) => s.session_id === sessionId)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
    [allSolves, sessionId],
  );

  const sessionTimes = useMemo(
    () => sessionSolves.map(effTime),
    [sessionSolves],
  );

  // ── Overview (all solves) ──
  const totalTimeMs = useMemo(
    () => allSolves.reduce((s, x) => s + x.time_ms, 0),
    [allSolves],
  );
  const totalH = Math.floor(totalTimeMs / 3600000);
  const totalM = Math.floor((totalTimeMs % 3600000) / 60000);

  const sessionPuzzleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of sessions) map[s.id] = s.puzzle;
    try {
      const raw = localStorage.getItem("cubewise_timer_prefs");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          sessionPuzzles?: Record<string, string>;
        };
        for (const [sid, puzzle] of Object.entries(
          parsed.sessionPuzzles ?? {},
        )) {
          map[sid] = puzzle;
        }
      }
    } catch {
      // localStorage unavailable
    }
    return map;
  }, [sessions]);

  const methodCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of allSolves) {
      const m = s.method ?? sessionPuzzleMap[s.session_id] ?? "3×3";
      map.set(m, (map.get(m) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);
  }, [allSolves, sessionPuzzleMap]);

  const topEvent = methodCounts[0];
  const eventCount = methodCounts.length;
  const eventNames = methodCounts.map((m) => m.method).join(", ");

  // ── Session stats ──
  const sessionCount = sessionSolves.length;
  const validTimes = useMemo(
    () => sessionTimes.filter(Number.isFinite),
    [sessionTimes],
  );

  const bestSingle = useMemo(
    () => (validTimes.length ? Math.min(...validTimes) : null),
    [validTimes],
  );

  const sessionMean = useMemo(
    () =>
      validTimes.length
        ? validTimes.reduce((s, x) => s + x, 0) / validTimes.length
        : null,
    [validTimes],
  );

  const bestAo5Info = useMemo(
    () => bestRolling(sessionTimes, 5),
    [sessionTimes],
  );
  const bestAo12Info = useMemo(
    () => bestRolling(sessionTimes, 12),
    [sessionTimes],
  );
  const bestAo100Info = useMemo(
    () => bestRolling(sessionTimes, 100),
    [sessionTimes],
  );

  const currentAo5 = useMemo(() => calcAo(sessionTimes, 5), [sessionTimes]);
  const currentAo12 = useMemo(() => calcAo(sessionTimes, 12), [sessionTimes]);
  const currentAo100 = useMemo(() => calcAo(sessionTimes, 100), [sessionTimes]);

  const medianTime = useMemo(() => median(sessionTimes), [sessionTimes]);
  const stdDevTime = useMemo(() => stdDev(sessionTimes), [sessionTimes]);

  // ── Canvas refs ──
  const trendRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (trendRef.current)
      drawTrend(trendRef.current, sessionTimes, activeSeries, smooth);
  }, [sessionTimes, activeSeries, smooth]);

  useEffect(() => {
    if (histRef.current) drawHist(histRef.current, sessionTimes);
  }, [sessionTimes]);

  useEffect(() => {
    let tid = 0;
    const onResize = () => {
      clearTimeout(tid);
      tid = window.setTimeout(() => {
        if (trendRef.current)
          drawTrend(trendRef.current, sessionTimes, activeSeries, smooth);
        if (histRef.current) drawHist(histRef.current, sessionTimes);
      }, 100);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(tid);
    };
  }, [sessionTimes, activeSeries, smooth]);

  // ── Ao5 breakdown: find dropped indices ──
  const ao5Window = bestAo5Info?.windowTimes ?? [];
  const [dropFastIdx, dropSlowIdx] = useMemo(() => {
    if (ao5Window.length < 5) return [-1, -1];
    let minI = 0,
      maxI = 0;
    for (let i = 1; i < ao5Window.length; i++) {
      if (ao5Window[i] < ao5Window[minI]) minI = i;
      if (ao5Window[i] > ao5Window[maxI]) maxI = i;
    }
    return [minI, maxI];
  }, [ao5Window]);

  const hasData = allSolves.length > 0;
  const hasSession = sessionSolves.length > 0;

  return (
    <div
      className="st-scroll"
      style={{ padding: "32px 36px 60px", minWidth: 0, overflowX: "hidden" }}
    >
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            ...mono,
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--blue)",
            marginBottom: "6px",
          }}
        >
          Statistics
        </p>
        <h1
          style={{
            ...sans,
            fontSize: "28px",
            fontWeight: 700,
            letterSpacing: "-0.8px",
            lineHeight: 1.1,
            color: "var(--t1)",
            marginBottom: "4px",
          }}
        >
          Your numbers.
        </h1>
        <p
          style={{
            ...sans,
            fontSize: "13.5px",
            color: "var(--t2)",
            lineHeight: 1.5,
          }}
        >
          All time, all sessions, all events.
        </p>
      </div>

      {/* ── Overview ────────────────────────────────────────────────────── */}
      <SectionLabel>Overview</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Total time"
          value={hasData ? `${totalH}h ${totalM}m` : "0h 0m"}
          sub="across all sessions"
          valueColor="var(--orange)"
        />
        <StatCard
          label="Total solves"
          value={allSolves.length.toLocaleString()}
          sub="all events"
          valueColor="var(--blue)"
        />
        <StatCard
          label="Events"
          value={hasData ? eventCount.toString() : "0"}
          sub={hasData ? eventNames : "none"}
        />
        <StatCard
          label="Top event"
          value={topEvent?.method ?? "—"}
          sub={
            topEvent
              ? `${topEvent.count.toLocaleString()} solves · ${Math.round((topEvent.count / allSolves.length) * 100)}%`
              : "no data"
          }
          valueSize={24}
        />
      </div>

      {/* ── Session ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <SectionLabel>Session</SectionLabel>
        {sessions.length > 0 ? (
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="st-session-select"
            style={{ marginTop: "-12px" }}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : null}
        <span
          style={{
            ...mono,
            fontSize: "10px",
            color: "var(--t3)",
            marginTop: "-12px",
          }}
        >
          {sessionCount} solves
        </span>
      </div>

      {/* Row 1: PBs + session mean */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <PBCard
          label="Best Single"
          value={bestSingle !== null ? fmt(bestSingle) : "—"}
          sub="session PB"
        />
        <PBCard
          label="Best Ao5"
          value={bestAo5Info ? fmt(bestAo5Info.value) : "—"}
          sub="session PB"
        />
        <StatCard
          label="Session Mean"
          value={sessionMean !== null ? fmt(sessionMean) : "—"}
          sub={`${validTimes.length} solves`}
          valueColor="var(--yellow)"
        />
      </div>

      {/* Row 2: Current averages */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 32,
        }}
      >
        <CurrCard
          label="Current Ao5"
          value={currentAo5 !== null ? fmt(currentAo5) : "—"}
          sub="last 5 solves"
        />
        <CurrCard
          label="Current Ao12"
          value={currentAo12 !== null ? fmt(currentAo12) : "—"}
          sub="last 12 solves"
        />
        <CurrCard
          label="Current Ao100"
          value={currentAo100 !== null ? fmt(currentAo100) : "—"}
          sub="last 100 solves"
        />
      </div>

      {/* ── Best stats ──────────────────────────────────────────────────── */}
      <SectionLabel>Best stats</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          alignItems: "start",
          marginBottom: 32,
        }}
      >
        {/* Left: Best Ao12 + Ao100 */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <PBCard
            label="Best Ao12"
            value={bestAo12Info ? fmt(bestAo12Info.value) : "—"}
            sub={
              bestAo12Info && sessionSolves[bestAo12Info.endIndex]
                ? fmtDate(sessionSolves[bestAo12Info.endIndex].created_at)
                : "—"
            }
          />
          <PBCard
            label="Best Ao100"
            value={bestAo100Info ? fmt(bestAo100Info.value) : "—"}
            sub={
              bestAo100Info && sessionSolves[bestAo100Info.endIndex]
                ? fmtDate(sessionSolves[bestAo100Info.endIndex].created_at)
                : "—"
            }
          />
        </div>

        {/* Right: Best Ao5 Breakdown */}
        <div className="st-chart-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <p
              style={{
                ...sans,
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--t2)",
              }}
            >
              Best Ao5 breakdown
            </p>
            <p style={{ ...mono, fontSize: "10px", color: "var(--t3)" }}>
              brackets = dropped
            </p>
          </div>
          {ao5Window.length === 5 && bestAo5Info ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {ao5Window.map((t, i) => {
                  const dropped = i === dropFastIdx || i === dropSlowIdx;
                  return (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-element window
                      key={i}
                      style={{
                        ...mono,
                        fontSize: "15px",
                        fontWeight: 400,
                        color: dropped ? "var(--t3)" : "var(--t2)",
                      }}
                    >
                      {dropped ? `(${fmt(t)})` : fmt(t)}
                    </span>
                  );
                })}
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    ...mono,
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "var(--t3)",
                    marginBottom: 2,
                  }}
                >
                  average
                </p>
                <p
                  style={{
                    ...mono,
                    fontSize: "18px",
                    fontWeight: 500,
                    color: "var(--blue)",
                  }}
                >
                  {fmt(bestAo5Info.value)}
                </p>
              </div>
            </div>
          ) : (
            <p
              style={{
                ...sans,
                padding: "20px 4px",
                fontSize: "13px",
                color: "var(--t3)",
              }}
            >
              {hasSession ? "Need 5+ solves" : "No session selected"}
            </p>
          )}
        </div>
      </div>

      {/* ── Time trend ──────────────────────────────────────────────────── */}
      <SectionLabel>Time trend</SectionLabel>
      <div className="st-chart-card" style={{ marginBottom: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <p
            style={{
              ...sans,
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--t2)",
            }}
          >
            Solve times over session
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ ...mono, fontSize: "10px", color: "var(--t3)" }}>
              Style
            </span>
            <button
              type="button"
              onClick={() => setSmooth(true)}
              className={`st-toggle-btn${smooth ? " st-toggle-btn-active" : ""}`}
            >
              Smooth
            </button>
            <button
              type="button"
              onClick={() => setSmooth(false)}
              className={`st-toggle-btn${!smooth ? " st-toggle-btn-active" : ""}`}
            >
              Sharp
            </button>
          </div>
        </div>

        {/* Series selection pills */}
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          {SERIES_ORDER.map((key) => {
            const meta = SERIES_META[key];
            const available = sessionTimes.length >= meta.minSolves;
            const active = activeSeries.has(key);
            return (
              <button
                key={key}
                type="button"
                disabled={!available}
                onClick={() => toggleSeries(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: `0.5px solid ${active ? meta.color : "var(--b2)"}`,
                  background: active ? `${meta.color}1a` : "transparent",
                  cursor: available ? "pointer" : "not-allowed",
                  opacity: available ? 1 : 0.35,
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: active ? meta.color : "transparent",
                    border: `1.5px solid ${active ? meta.color : "var(--t3)"}`,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                />
                <span
                  style={{
                    ...sans,
                    fontSize: "12px",
                    color: active ? meta.color : "var(--t3)",
                    transition: "color 0.15s",
                  }}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active series legend */}
        {activeSeries.size > 0 && (
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {SERIES_ORDER.filter((k) => activeSeries.has(k)).map((k) => {
              const meta = SERIES_META[k];
              return (
                <div
                  key={k}
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 18,
                      height: meta.lineWidth,
                      background: meta.color,
                      borderRadius: 1,
                    }}
                  />
                  <span
                    style={{ ...mono, fontSize: "10px", color: "var(--t3)" }}
                  >
                    {k === "raw" ? "All times" : `Rolling ${meta.label}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <canvas
          ref={trendRef}
          style={{ width: "100%", height: 160, display: "block" }}
        />
      </div>

      {/* ── Time distribution ───────────────────────────────────────────── */}
      <SectionLabel>Time distribution</SectionLabel>
      <div className="st-chart-card">
        <div style={{ marginBottom: 8 }}>
          <p
            style={{
              ...sans,
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--t2)",
            }}
          >
            Solve time histogram
          </p>
          {hasSession && medianTime !== null && (
            <p
              style={{
                ...mono,
                fontSize: "10px",
                color: "var(--t3)",
                marginTop: 4,
              }}
            >
              Median:{" "}
              <span style={{ color: "var(--yellow)" }}>
                {(medianTime / 1000).toFixed(2)}s
              </span>
              {" · "}
              Mean:{" "}
              <span style={{ color: "var(--t2)" }}>
                {sessionMean !== null
                  ? `${(sessionMean / 1000).toFixed(2)}s`
                  : "—"}
              </span>
              {" · "}
              Std dev:{" "}
              {stdDevTime !== null ? `${(stdDevTime / 1000).toFixed(2)}s` : "—"}
            </p>
          )}
        </div>
        <canvas
          ref={histRef}
          style={{ width: "100%", height: 140, display: "block" }}
        />
      </div>
    </div>
  );
}
