"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock3,
  Gauge,
  Medal,
  Target,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Link from "next/link";
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
const C_PAD = { top: 22, right: 22, bottom: 34, left: 52 };

function canvasMonoFont(size = 10): string {
  const family = getComputedStyle(document.body)
    .getPropertyValue("--font-roboto-mono")
    .trim();
  return `${size}px ${family || "'Roboto Mono', monospace"}`;
}

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
  const ch = 230;
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
  ctx.font = canvasMonoFont();
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
  const ch = 190;
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
  ctx.font = canvasMonoFont();
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
    g.addColorStop(0, "rgba(112,223,195,0.72)");
    g.addColorStop(1, "rgba(112,223,195,0.08)");
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

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({
  Icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  tone?: "blue" | "orange" | "purple" | "teal" | "neutral";
}) {
  return (
    <article className="st-stat-card" data-tone={tone}>
      <div className="st-stat-card__top">
        <span className="st-stat-card__icon">
          <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <p className="st-stat-label">{label}</p>
      </div>
      <p className="st-stat-value">{value}</p>
      <p className="st-stat-sub">{sub}</p>
    </article>
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
    <article className="st-pb-card">
      <div className="st-card-kicker">
        <Trophy size={14} strokeWidth={1.8} aria-hidden="true" />
        <p className="st-pb-label">{label}</p>
      </div>
      <p className="st-pb-value">{value}</p>
      <p className="st-pb-sub">{sub}</p>
    </article>
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
    <article className="st-curr-card">
      <div className="st-card-kicker">
        <Gauge size={14} strokeWidth={1.8} aria-hidden="true" />
        <p className="st-curr-label">{label}</p>
      </div>
      <p className="st-curr-value">{value}</p>
      <p className="st-curr-sub">{sub}</p>
    </article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="st-section-label">{children}</p>;
}

// ── Main component ────────────────────────────────────────────────────────────
export function StatsClient({ allSolves, sessions }: Props) {
  const [sessionId, setSessionId] = useState<string>(sessions[0]?.id ?? "");
  const [activeSeries, setActiveSeries] = useState<Set<SeriesKey>>(
    () => new Set<SeriesKey>(["raw", "ao5"]),
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
  const selectedSession = sessions.find((session) => session.id === sessionId);
  const activeDayCount = useMemo(
    () =>
      new Set(
        allSolves.map((solve) => new Date(solve.created_at).toDateString()),
      ).size,
    [allSolves],
  );
  const sessionDayCount = useMemo(
    () =>
      new Set(
        sessionSolves.map((solve) => new Date(solve.created_at).toDateString()),
      ).size,
    [sessionSolves],
  );
  const dnfCount = sessionSolves.filter(
    (solve) => solve.penalty === "dnf",
  ).length;
  const consistencyScore =
    sessionMean !== null && stdDevTime !== null && sessionMean > 0
      ? Math.max(
          0,
          Math.min(100, Math.round(100 - (stdDevTime / sessionMean) * 100)),
        )
      : null;
  const comparisonSize = Math.min(10, Math.floor(validTimes.length / 2));
  const openingAverage =
    comparisonSize >= 3
      ? validTimes
          .slice(0, comparisonSize)
          .reduce((sum, time) => sum + time, 0) / comparisonSize
      : null;
  const recentAverage =
    comparisonSize >= 3
      ? validTimes.slice(-comparisonSize).reduce((sum, time) => sum + time, 0) /
        comparisonSize
      : null;
  const paceDelta =
    openingAverage !== null && recentAverage !== null
      ? openingAverage - recentAverage
      : null;
  const paceIsFaster = paceDelta !== null && paceDelta >= 0;
  const paceDirection =
    paceDelta === null ? "neutral" : paceIsFaster ? "faster" : "slower";
  const paceValue =
    paceDelta === null
      ? "Building baseline"
      : `${fmt(Math.abs(paceDelta))} ${paceIsFaster ? "faster" : "slower"}`;

  return (
    <div className="stats-page st-scroll">
      <header className="stats-hero">
        <div className="stats-hero__copy">
          <p className="stats-eyebrow">
            <Activity size={14} strokeWidth={1.8} aria-hidden="true" />
            Performance lab
          </p>
          <h1>Performance</h1>
          <p>
            {allSolves.length.toLocaleString()} solves across {sessions.length}{" "}
            {sessions.length === 1 ? "session" : "sessions"}
          </p>
        </div>

        {sessions.length > 0 ? (
          <label className="stats-session-picker">
            <span>Active session</span>
            <div>
              <select
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </div>
          </label>
        ) : null}
      </header>

      {/* ── Overview ────────────────────────────────────────────────────── */}
      <SectionLabel>All-time overview</SectionLabel>
      <div className="stats-overview-grid">
        <StatCard
          Icon={Clock3}
          label="Total time"
          value={hasData ? `${totalH}h ${totalM}m` : "0h 0m"}
          sub="across all sessions"
          tone="orange"
        />
        <StatCard
          Icon={TimerReset}
          label="Total solves"
          value={allSolves.length.toLocaleString()}
          sub="all events"
          tone="blue"
        />
        <StatCard
          Icon={CalendarDays}
          label="Practice days"
          value={activeDayCount.toString()}
          sub={
            hasData
              ? `${eventCount} ${eventCount === 1 ? "event" : "events"}`
              : "no activity yet"
          }
          tone="teal"
        />
        <StatCard
          Icon={Medal}
          label="Top event"
          value={topEvent?.method ?? "—"}
          sub={
            topEvent
              ? `${topEvent.count.toLocaleString()} solves · ${Math.round((topEvent.count / allSolves.length) * 100)}%`
              : "no data"
          }
          tone="purple"
        />
      </div>

      {hasData ? (
        <>
          <div className="stats-section-heading">
            <div>
              <p className="stats-eyebrow">
                <Target size={13} strokeWidth={1.8} aria-hidden="true" />
                Selected session
              </p>
              <h2>Session pulse</h2>
              <p>{selectedSession?.name ?? "No session selected"}</p>
            </div>
            <span className="stats-count-badge">{sessionCount} solves</span>
          </div>

          {/* Row 1: PBs + session mean */}
          <div className="stats-session-grid stats-session-grid--primary">
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
              Icon={BarChart3}
              label="Session Mean"
              value={sessionMean !== null ? fmt(sessionMean) : "—"}
              sub={`${validTimes.length} solves`}
              tone="orange"
            />
          </div>

          {/* Row 2: Current averages */}
          <div className="stats-session-grid stats-session-grid--current">
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

          <section
            className="stats-insight-band"
            data-direction={paceDirection}
          >
            <div className="stats-insight-band__icon">
              {paceDirection === "neutral" ? (
                <Activity size={20} aria-hidden="true" />
              ) : paceIsFaster ? (
                <TrendingDown size={20} aria-hidden="true" />
              ) : (
                <TrendingUp size={20} aria-hidden="true" />
              )}
            </div>
            <div className="stats-insight-band__copy">
              <span>Session pace</span>
              <strong>{paceValue}</strong>
              <p>
                {paceDelta === null
                  ? "Complete at least six solves to compare your opening and recent pace."
                  : `Recent ${comparisonSize}-solve pace against your opening ${comparisonSize}.`}
              </p>
            </div>
            <div className="stats-insight-band__metrics">
              <div>
                <span>Consistency</span>
                <strong>
                  {consistencyScore ?? "—"}
                  {consistencyScore !== null ? "%" : ""}
                </strong>
              </div>
              <div>
                <span>Practice days</span>
                <strong>{sessionDayCount}</strong>
              </div>
              <div>
                <span>DNFs</span>
                <strong>{dnfCount}</strong>
              </div>
            </div>
          </section>

          {/* ── Best stats ──────────────────────────────────────────────────── */}
          <SectionLabel>Best stats</SectionLabel>
          <div className="stats-best-grid">
            {/* Left: Best Ao12 + Ao100 */}
            <div className="stats-best-grid__pbs">
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
            <div className="st-chart-card stats-ao5-card">
              <div className="stats-panel-heading">
                <div>
                  <span>Best window</span>
                  <h3>Ao5 breakdown</h3>
                </div>
                <p>Brackets are dropped</p>
              </div>
              {ao5Window.length === 5 && bestAo5Info ? (
                <div className="stats-ao5-breakdown">
                  <div className="stats-ao5-times">
                    {ao5Window.map((t, i) => {
                      const dropped = i === dropFastIdx || i === dropSlowIdx;
                      return (
                        <span
                          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-element window
                          key={i}
                          data-dropped={dropped}
                        >
                          {dropped ? `(${fmt(t)})` : fmt(t)}
                        </span>
                      );
                    })}
                  </div>
                  <div className="stats-ao5-result">
                    <span>Average</span>
                    <strong>{fmt(bestAo5Info.value)}</strong>
                  </div>
                </div>
              ) : (
                <p className="stats-panel-empty">
                  {hasSession ? "Need 5+ solves" : "No session selected"}
                </p>
              )}
            </div>
          </div>

          <SectionLabel>Time trend</SectionLabel>
          <div className="st-chart-card stats-trend-card">
            <div className="stats-chart-heading">
              <div>
                <span>Session timeline</span>
                <h3>Solve times</h3>
              </div>
              <fieldset className="stats-chart-style">
                <legend className="sr-only">Chart line style</legend>
                <button
                  type="button"
                  onClick={() => setSmooth(true)}
                  className={`st-toggle-btn${smooth ? " st-toggle-btn-active" : ""}`}
                  aria-pressed={smooth}
                >
                  Smooth
                </button>
                <button
                  type="button"
                  onClick={() => setSmooth(false)}
                  className={`st-toggle-btn${!smooth ? " st-toggle-btn-active" : ""}`}
                  aria-pressed={!smooth}
                >
                  Sharp
                </button>
              </fieldset>
            </div>

            {/* Series selection pills */}
            <div className="stats-series-controls">
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
                    className="stats-series-button"
                    data-active={active}
                    aria-pressed={active}
                    style={
                      { "--series-color": meta.color } as React.CSSProperties
                    }
                  >
                    <span aria-hidden="true" />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {sessionTimes.length >= 2 ? (
              <canvas
                ref={trendRef}
                className="stats-trend-canvas"
                role="img"
                aria-label="Solve times and rolling averages across the selected session"
              />
            ) : (
              <div className="stats-chart-empty">
                Add another solve to draw a trend.
              </div>
            )}
          </div>

          <SectionLabel>Patterns</SectionLabel>
          <div className="stats-pattern-grid">
            <div className="st-chart-card stats-distribution-card">
              <div className="stats-panel-heading">
                <div>
                  <span>Time distribution</span>
                  <h3>Where your solves land</h3>
                </div>
                {hasSession && medianTime !== null ? (
                  <p>
                    Median <strong>{(medianTime / 1000).toFixed(2)}s</strong>
                  </p>
                ) : null}
              </div>
              {sessionTimes.length >= 2 ? (
                <canvas
                  ref={histRef}
                  className="stats-histogram-canvas"
                  role="img"
                  aria-label="Distribution of solve times in the selected session"
                />
              ) : (
                <div className="stats-chart-empty">
                  Add another solve to build a distribution.
                </div>
              )}
              <div className="stats-distribution-meta">
                <span>
                  Mean {sessionMean !== null ? fmt(sessionMean) : "—"}
                </span>
                <span>
                  Deviation {stdDevTime !== null ? fmt(stdDevTime) : "—"}
                </span>
              </div>
            </div>

            <aside className="stats-event-mix">
              <div className="stats-panel-heading">
                <div>
                  <span>All-time mix</span>
                  <h3>Events practiced</h3>
                </div>
              </div>
              <div className="stats-event-mix__list">
                {methodCounts.slice(0, 5).map((event) => (
                  <div key={event.method} className="stats-event-row">
                    <div>
                      <strong>{event.method}</strong>
                      <span>{event.count.toLocaleString()} solves</span>
                    </div>
                    <div className="stats-event-row__track">
                      <span
                        style={{
                          width: `${Math.max(4, Math.round((event.count / allSolves.length) * 100))}%`,
                        }}
                      />
                    </div>
                    <em>
                      {Math.round((event.count / allSolves.length) * 100)}%
                    </em>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </>
      ) : (
        <section className="stats-empty-state">
          <span>
            <BarChart3 size={22} aria-hidden="true" />
          </span>
          <h2>Your first trend starts with one solve.</h2>
          <p>
            Open the timer, record a solve, and your performance history will
            begin here.
          </p>
          <Link href="/timer">
            Open timer <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}
