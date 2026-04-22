"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

export interface Solve {
  id: string;
  time: number; // seconds, e.g. 12.34
  scramble: string;
  puzzle: string;
  sessionId: string;
  createdAt: number;
  penalty: null | "+2" | "DNF";
}

// ── helpers ─────────────────────────────────────────────────────────────────

function effectiveTime(s: Solve): number {
  if (s.penalty === "DNF") return Number.POSITIVE_INFINITY;
  if (s.penalty === "+2") return s.time + 2;
  return s.time;
}

function fmt(secs: number): string {
  if (!Number.isFinite(secs)) return "DNF";
  if (secs < 60) return secs.toFixed(2);
  const m = Math.floor(secs / 60);
  return `${m}:${(secs % 60).toFixed(2).padStart(5, "0")}`;
}

function fmtSolveTime(s: Solve): string {
  if (s.penalty === "DNF") return "DNF";
  const t = s.penalty === "+2" ? s.time + 2 : s.time;
  return fmt(t) + (s.penalty === "+2" ? "+" : "");
}

function computeMo3(solves: Solve[], offset = 0): number | null {
  const slice = solves.slice(offset, offset + 3);
  if (slice.length < 3) return null;
  const times = slice.map(effectiveTime);
  if (times.some((t) => !Number.isFinite(t))) return null;
  return times.reduce((a, b) => a + b, 0) / 3;
}

function computeAo(solves: Solve[], n: number, offset = 0): number | null {
  const slice = solves.slice(offset, offset + n);
  if (slice.length < n) return null;
  const sorted = slice.map(effectiveTime).sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  if (trimmed.some((t) => !Number.isFinite(t))) return null;
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

function bestOf(
  solves: Solve[],
  fn: (s: Solve[], offset: number) => number | null,
): number | null {
  let best: number | null = null;
  for (let i = 0; i < solves.length; i++) {
    const v = fn(solves, i);
    if (v !== null && (best === null || v < best)) best = v;
  }
  return best;
}

function sessionMean(solves: Solve[]): number | null {
  const valid = solves.map(effectiveTime).filter(Number.isFinite);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// ── PB detection ─────────────────────────────────────────────────────────────

function computePBSet(solves: Solve[]): Set<string> {
  // For each solve, check if ao5/ao12 at that position is a PB at that point in time
  const pbs = new Set<string>();
  let bestAo12: number | null = null;
  // solves are newest-first; iterate oldest-first for chronological PB tracking
  const reversed = [...solves].reverse();
  for (let i = 0; i < reversed.length; i++) {
    const windowSolves = reversed.slice(i);
    const ao12 = computeAo(windowSolves, 12);
    if (ao12 !== null && (bestAo12 === null || ao12 < bestAo12)) {
      bestAo12 = ao12;
      pbs.add(reversed[i].id);
    }
  }
  return pbs;
}

// ── Solve detail modal ───────────────────────────────────────────────────────

interface SolveDetailProps {
  solve: Solve;
  onClose: () => void;
  onSetPenalty: (id: string, penalty: null | "+2" | "DNF") => void;
  onDelete: (id: string) => void;
}

function SolveDetail({
  solve,
  onClose,
  onSetPenalty,
  onDelete,
}: SolveDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="w-full max-w-xs rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {fmtSolveTime(solve)}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 font-mono text-xs leading-relaxed tracking-wide text-muted-foreground">
          {solve.scramble}
        </p>

        <p className="mb-4 text-xs text-muted-foreground">
          {new Date(solve.createdAt).toLocaleString()}
        </p>

        {/* Penalty toggles */}
        <div className="mb-4 flex gap-2">
          {([null, "+2", "DNF"] as const).map((p) => (
            <button
              key={String(p)}
              type="button"
              onClick={() => onSetPenalty(solve.id, p)}
              className={cn(
                "h-7 rounded-md border px-3 text-xs font-medium transition-colors",
                solve.penalty === p
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
              )}
            >
              {p === null ? "OK" : p}
            </button>
          ))}
        </div>

        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onDelete(solve.id);
                onClose();
              }}
              className="flex h-7 flex-1 items-center justify-center rounded-md bg-destructive text-xs font-medium text-white transition-colors hover:bg-destructive/90"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex h-7 flex-1 items-center justify-center rounded-md border border-border text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-7 w-full items-center justify-center rounded-md border border-destructive/50 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-white"
          >
            Delete solve
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface SessionPanelProps {
  sessionName: string;
  solves: Solve[]; // newest first
  onDeleteSolve: (id: string) => void;
  onSetPenalty: (id: string, penalty: null | "+2" | "DNF") => void;
}

export function SessionPanel({
  sessionName,
  solves,
  onDeleteSolve,
  onSetPenalty,
}: SessionPanelProps) {
  const [detailSolve, setDetailSolve] = useState<Solve | null>(null);

  // Stats
  const currentBest =
    solves.length > 0 ? Math.min(...solves.map(effectiveTime)) : null;
  const allBestSingle = currentBest;
  const currentMo3 = computeMo3(solves);
  const bestMo3 = bestOf(solves, computeMo3);
  const currentAo5 = computeAo(solves, 5);
  const bestAo5 = bestOf(solves, (s, o) => computeAo(s, 5, o));
  const currentAo12 = computeAo(solves, 12);
  const bestAo12 = bestOf(solves, (s, o) => computeAo(s, 12, o));
  const currentAo100 = computeAo(solves, 100);
  const bestAo100 = bestOf(solves, (s, o) => computeAo(s, 100, o));
  const mean = sessionMean(solves);

  const statRows = [
    {
      label: "time",
      current: solves[0] ? fmtSolveTime(solves[0]) : "—",
      best: allBestSingle !== null ? fmt(allBestSingle) : "—",
      isPB:
        solves.length > 0 &&
        currentBest !== null &&
        effectiveTime(solves[0]) === currentBest,
    },
    {
      label: "mo3",
      current: currentMo3 !== null ? fmt(currentMo3) : "—",
      best: bestMo3 !== null ? fmt(bestMo3) : "—",
      isPB: currentMo3 !== null && bestMo3 !== null && currentMo3 === bestMo3,
    },
    {
      label: "ao5",
      current: currentAo5 !== null ? fmt(currentAo5) : "—",
      best: bestAo5 !== null ? fmt(bestAo5) : "—",
      isPB: currentAo5 !== null && bestAo5 !== null && currentAo5 === bestAo5,
    },
    {
      label: "ao12",
      current: currentAo12 !== null ? fmt(currentAo12) : "—",
      best: bestAo12 !== null ? fmt(bestAo12) : "—",
      isPB:
        currentAo12 !== null && bestAo12 !== null && currentAo12 === bestAo12,
    },
    {
      label: "ao100",
      current: currentAo100 !== null ? fmt(currentAo100) : "—",
      best: bestAo100 !== null ? fmt(bestAo100) : "—",
      isPB:
        currentAo100 !== null &&
        bestAo100 !== null &&
        currentAo100 === bestAo100,
    },
  ];

  const pbSet = computePBSet(solves);

  return (
    <>
      <div className="flex w-56 shrink-0 flex-col overflow-hidden border-l border-border">
        {/* Header */}
        <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
          <span className="flex-1 truncate text-xs font-medium text-foreground">
            {sessionName}
          </span>
        </div>

        {/* Stats table */}
        <div className="shrink-0 border-b border-border px-3 py-2">
          <div className="grid grid-cols-3 gap-x-2 text-xs">
            <span className="text-muted-foreground" />
            <span className="text-right text-muted-foreground">curr</span>
            <span className="text-right text-muted-foreground">best</span>
            {statRows.map((row) => (
              <>
                <span
                  key={`${row.label}-label`}
                  className="py-0.5 font-mono text-muted-foreground"
                >
                  {row.label}
                </span>
                <span
                  key={`${row.label}-curr`}
                  className={cn(
                    "py-0.5 text-right font-mono tabular-nums",
                    row.isPB ? "font-bold text-orange-400" : "text-foreground",
                  )}
                >
                  {row.current}
                </span>
                <span
                  key={`${row.label}-best`}
                  className="py-0.5 text-right font-mono tabular-nums text-muted-foreground"
                >
                  {row.best}
                </span>
              </>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="shrink-0 border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
          {solves.length} solve{solves.length !== 1 ? "s" : ""}
          {mean !== null && ` · mean ${fmt(mean)}`}
        </div>

        {/* List header */}
        <div className="grid shrink-0 grid-cols-[20px_1fr_44px_44px] gap-x-1 border-b border-border px-3 py-1 text-xs text-muted-foreground">
          <span>#</span>
          <span>time</span>
          <span className="text-right">ao5</span>
          <span className="text-right">ao12</span>
        </div>

        {/* Solve list */}
        <div className="flex-1 overflow-y-auto">
          {solves.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              No solves yet.
            </p>
          ) : (
            solves.map((solve, i) => {
              const rowAo5 = computeAo(solves, 5, i);
              const rowAo12 = computeAo(solves, 12, i);
              const isPB = pbSet.has(solve.id);
              return (
                <button
                  key={solve.id}
                  type="button"
                  onClick={() => setDetailSolve(solve)}
                  className={cn(
                    "grid w-full grid-cols-[20px_1fr_44px_44px] gap-x-1 px-3 py-1 text-left text-xs transition-colors hover:bg-accent/60",
                    isPB && "text-orange-400",
                  )}
                >
                  <span className="text-muted-foreground">
                    {solves.length - i}
                  </span>
                  <span className="truncate font-mono tabular-nums">
                    {fmtSolveTime(solve)}
                  </span>
                  <span className="text-right font-mono tabular-nums text-muted-foreground">
                    {rowAo5 !== null ? fmt(rowAo5) : "—"}
                  </span>
                  <span className="text-right font-mono tabular-nums text-muted-foreground">
                    {rowAo12 !== null ? fmt(rowAo12) : "—"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {detailSolve && (
        <SolveDetail
          solve={detailSolve}
          onClose={() => setDetailSolve(null)}
          onSetPenalty={(id, p) => {
            onSetPenalty(id, p);
            // Update local reference so the modal reflects the change
            setDetailSolve((prev) =>
              prev?.id === id ? { ...prev, penalty: p } : prev,
            );
          }}
          onDelete={(id) => {
            onDeleteSolve(id);
            setDetailSolve(null);
          }}
        />
      )}
    </>
  );
}
