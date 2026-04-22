export interface SolveForStats {
  time_ms: number;
  penalty: "dnf" | "+2" | null;
}

export function effectiveTime(solve: SolveForStats): number {
  if (solve.penalty === "dnf") return Infinity;
  if (solve.penalty === "+2") return solve.time_ms + 2000;
  return solve.time_ms;
}

// Standard WCA averaging: drop best and worst, DNF > 1 in window = Infinity
export function calculateAo(solves: SolveForStats[], n: number): number | null {
  if (solves.length < n) return null;
  const window = solves.slice(0, n);
  const times = window.map(effectiveTime);
  const dnfCount = times.filter((t) => !Number.isFinite(t)).length;
  if (dnfCount > 1) return Infinity;
  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  if (trimmed.some((t) => !Number.isFinite(t))) return Infinity;
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export function calculateBest(solves: SolveForStats[]): number | null {
  if (solves.length === 0) return null;
  const times = solves.map(effectiveTime).filter(Number.isFinite);
  if (times.length === 0) return null;
  return Math.min(...times);
}

export function calculateMean(solves: SolveForStats[]): number | null {
  const times = solves.map(effectiveTime).filter(Number.isFinite);
  if (times.length === 0) return null;
  return times.reduce((a, b) => a + b, 0) / times.length;
}

export function fmtMs(ms: number): string {
  if (!Number.isFinite(ms)) return "DNF";
  const secs = ms / 1000;
  if (secs < 60) return secs.toFixed(2);
  const m = Math.floor(secs / 60);
  return `${m}:${(secs % 60).toFixed(2).padStart(5, "0")}`;
}
