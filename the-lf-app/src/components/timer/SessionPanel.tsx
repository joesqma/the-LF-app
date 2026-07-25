"use client";

import { X } from "lucide-react";
import { Fragment, useState } from "react";
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
    <div className="timer-modal-backdrop">
      <div className="timer-modal timer-solve-detail">
        <div className="timer-modal__header">
          <div>
            <span className="timer-modal__eyebrow">Solve detail</span>
            <p className="timer-solve-detail__time">{fmtSolveTime(solve)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="timer-modal__close"
            aria-label="Close solve details"
          >
            <X size={17} />
          </button>
        </div>

        <code className="timer-solve-detail__scramble">{solve.scramble}</code>

        <time className="timer-solve-detail__date">
          {new Date(solve.createdAt).toLocaleString()}
        </time>

        <fieldset className="timer-penalty-options">
          <legend className="sr-only">Solve penalty</legend>
          {([null, "+2", "DNF"] as const).map((p) => (
            <button
              key={String(p)}
              type="button"
              onClick={() => onSetPenalty(solve.id, p)}
              className={solve.penalty === p ? "is-active" : undefined}
            >
              {p === null ? "OK" : p}
            </button>
          ))}
        </fieldset>

        {confirmDelete ? (
          <div className="timer-modal__actions">
            <button
              type="button"
              onClick={() => {
                onDelete(solve.id);
                onClose();
              }}
              className="is-destructive"
            >
              Delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="timer-solve-detail__delete"
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
      <aside className="timer-session-panel">
        <header className="timer-session-panel__header">
          <div>
            <span>Session</span>
            <h2>{sessionName}</h2>
          </div>
          <strong>
            <span>{solves.length}</span> solve{solves.length !== 1 ? "s" : ""}
          </strong>
        </header>

        <section className="timer-session-summary" aria-label="Session summary">
          <span>Session mean</span>
          <strong>{mean !== null ? fmt(mean) : "—"}</strong>
        </section>

        <section className="timer-session-stats" aria-label="Session averages">
          <div className="timer-session-stats__grid">
            <span />
            <span>Current</span>
            <span>Best</span>
            {statRows.map((row) => (
              <Fragment key={row.label}>
                <span>{row.label}</span>
                <span
                  className={cn(
                    "timer-session-stats__value",
                    row.isPB && "is-pb",
                  )}
                >
                  {row.current}
                </span>
                <span className="timer-session-stats__value is-muted">
                  {row.best}
                </span>
              </Fragment>
            ))}
          </div>
        </section>

        <div className="timer-solve-list__header">
          <span>#</span>
          <span>Time</span>
          <span>ao5</span>
          <span>ao12</span>
        </div>

        <div className="timer-solve-list">
          {solves.length === 0 ? (
            <div className="timer-solve-list__empty">
              <strong>No solves yet</strong>
            </div>
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
                  className={cn("timer-solve-row", isPB && "is-pb")}
                >
                  <span>{solves.length - i}</span>
                  <strong>{fmtSolveTime(solve)}</strong>
                  <span>{rowAo5 !== null ? fmt(rowAo5) : "—"}</span>
                  <span>{rowAo12 !== null ? fmt(rowAo12) : "—"}</span>
                </button>
              );
            })
          )}
        </div>
      </aside>

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
