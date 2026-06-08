"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { AnalysisPhase } from "~/types/analysis";

function parseTimestamp(ts: string): number {
  const parts = ts.trim().split(":").map(Number);
  if (parts.length === 3) {
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }
  if (parts.length === 2) {
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  }
  return 0;
}

function normalizePhases(phases: AnalysisPhase[]): AnalysisPhase[] {
  const f2lPairs = phases.filter((p) => /^f2l pair \d+$/i.test(p.name));
  if (f2lPairs.length === 0) return phases;

  const merged: AnalysisPhase = {
    name: "F2L",
    timestamp_start: f2lPairs[0]?.timestamp_start ?? "",
    timestamp_end: f2lPairs[f2lPairs.length - 1]?.timestamp_end ?? "",
    algorithm_identified: null,
    observations: f2lPairs.map((p) => p.observations).join(" "),
    recommendation: f2lPairs
      .map((p) => p.recommendation)
      .filter((r, i, arr) => arr.indexOf(r) === i)
      .join(" "),
  };

  const insertIdx = phases.findIndex((p) => /^f2l pair \d+$/i.test(p.name));
  const f2lPairNames = new Set(f2lPairs.map((p) => p.name));
  return [
    ...phases.slice(0, insertIdx),
    merged,
    ...phases.slice(insertIdx).filter((p) => !f2lPairNames.has(p.name)),
  ];
}

// Analysis accent palette: blue · orange · red · purple
const PHASE_CHIP: Record<string, { bg: string; text: string }> = {
  cross: { bg: "var(--blue-dim)", text: "var(--blue)" },
  f2l: { bg: "var(--orange-dim)", text: "var(--orange)" },
  oll: { bg: "var(--red-dim)", text: "var(--red)" },
  pll: { bg: "var(--purple-dim)", text: "var(--purple)" },
};

function phaseChipColors(name: string) {
  const key = name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/pair\d+$/, "");
  return PHASE_CHIP[key] ?? { bg: "var(--s2)", text: "var(--t3)" };
}

interface Props {
  phases: AnalysisPhase[];
  onSeek?: (seconds: number) => void;
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export function PhaseBreakdown({ phases, onSeek }: Props) {
  const normalizedPhases = normalizePhases(phases);
  const [openId, setOpenId] = useState<string | null>(
    normalizedPhases[0]?.name ?? null,
  );

  function handleToggle(phase: AnalysisPhase) {
    const willOpen = openId !== phase.name;
    setOpenId(willOpen ? phase.name : null);
    if (willOpen && onSeek) {
      onSeek(parseTimestamp(phase.timestamp_start));
    }
  }

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
        Phase breakdown
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {normalizedPhases.map((phase) => {
          const isOpen = openId === phase.name;
          const chip = phaseChipColors(phase.name);

          return (
            <div
              key={phase.name}
              style={{
                background: "var(--s1)",
                border: "0.5px solid var(--b2)",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {/* Toggle header */}
              <button
                type="button"
                onClick={() => handleToggle(phase)}
                className="anl-phase-toggle"
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  {isOpen ? (
                    <ChevronDown
                      size={14}
                      strokeWidth={1.6}
                      aria-hidden="true"
                      style={{ color: "var(--t3)", flexShrink: 0 }}
                    />
                  ) : (
                    <ChevronRight
                      size={14}
                      strokeWidth={1.6}
                      aria-hidden="true"
                      style={{ color: "var(--t3)", flexShrink: 0 }}
                    />
                  )}

                  {/* Phase name chip */}
                  <span
                    style={{
                      ...mono,
                      fontSize: "9px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: chip.bg,
                      color: chip.text,
                      borderRadius: "20px",
                      padding: "2px 8px",
                      flexShrink: 0,
                    }}
                  >
                    {phase.name}
                  </span>

                  {/* Timestamps */}
                  {onSeek ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(parseTimestamp(phase.timestamp_start));
                      }}
                      style={{
                        ...mono,
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "var(--t3)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                        textDecorationColor: "var(--t3)",
                        textUnderlineOffset: "2px",
                      }}
                    >
                      {phase.timestamp_start}–{phase.timestamp_end}
                    </button>
                  ) : (
                    <span
                      style={{
                        ...mono,
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "var(--t3)",
                      }}
                    >
                      {phase.timestamp_start}–{phase.timestamp_end}
                    </span>
                  )}
                </div>

                {/* Algorithm */}
                {phase.algorithm_identified && (
                  <span
                    style={{
                      ...mono,
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "var(--orange)",
                      flexShrink: 0,
                    }}
                  >
                    {phase.algorithm_identified}
                  </span>
                )}
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div
                  style={{
                    background: "var(--s2)",
                    borderTop: "0.5px solid var(--b1)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        ...mono,
                        fontSize: "9px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        color: "var(--t3)",
                        marginBottom: "6px",
                      }}
                    >
                      Observation
                    </p>
                    <p
                      style={{
                        ...sans,
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "var(--t2)",
                        lineHeight: 1.65,
                      }}
                    >
                      {phase.observations}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        ...mono,
                        fontSize: "9px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        color: "var(--t3)",
                        marginBottom: "6px",
                      }}
                    >
                      Recommendation
                    </p>
                    <p
                      style={{
                        ...sans,
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "var(--t1)",
                        lineHeight: 1.65,
                      }}
                    >
                      {phase.recommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
