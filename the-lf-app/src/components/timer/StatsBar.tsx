"use client";

import {
  calculateAo,
  calculateBest,
  calculateMean,
  effectiveTime,
  fmtMs,
  type SolveForStats,
} from "~/utils/stats";

interface StatsBarProps {
  solves: SolveForStats[];
}

export function StatsBar({ solves }: StatsBarProps) {
  if (solves.length === 0) return null;

  const lastSolve = solves[0];
  const single = lastSolve ? fmtMs(effectiveTime(lastSolve)) : "—";
  const ao5 = calculateAo(solves, 5);
  const ao12 = calculateAo(solves, 12);
  const ao50 = calculateAo(solves, 50);
  const ao100 = calculateAo(solves, 100);
  const best = calculateBest(solves);
  const mean = calculateMean(solves);

  const stats = [
    { label: "single", value: single },
    { label: "ao5", value: ao5 !== null ? fmtMs(ao5) : "—" },
    { label: "ao12", value: ao12 !== null ? fmtMs(ao12) : "—" },
    { label: "ao50", value: ao50 !== null ? fmtMs(ao50) : "—" },
    { label: "ao100", value: ao100 !== null ? fmtMs(ao100) : "—" },
    { label: "best", value: best !== null ? fmtMs(best) : "—" },
    { label: "mean", value: mean !== null ? fmtMs(mean) : "—" },
  ];

  return (
    <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border px-2 py-2 [scrollbar-width:none]">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="flex shrink-0 flex-col items-center rounded-md border border-border px-2 py-1"
        >
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-foreground">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
