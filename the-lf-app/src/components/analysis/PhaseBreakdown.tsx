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

interface Props {
  phases: AnalysisPhase[];
  onSeek?: (seconds: number) => void;
}

export function PhaseBreakdown({ phases, onSeek }: Props) {
  const [openId, setOpenId] = useState<string | null>(phases[0]?.name ?? null);

  function handleToggle(phase: AnalysisPhase) {
    const willOpen = openId !== phase.name;
    setOpenId(willOpen ? phase.name : null);
    if (willOpen && onSeek) {
      onSeek(parseTimestamp(phase.timestamp_start));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Phase breakdown
      </p>
      <div className="flex flex-col gap-2">
        {phases.map((phase) => {
          const isOpen = openId === phase.name;
          return (
            <div
              key={phase.name}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => handleToggle(phase)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent/60"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {phase.name}
                  </span>
                  {onSeek ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(parseTimestamp(phase.timestamp_start));
                      }}
                      className="font-mono text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {phase.timestamp_start}–{phase.timestamp_end}
                    </button>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">
                      {phase.timestamp_start}–{phase.timestamp_end}
                    </span>
                  )}
                </div>
                {phase.algorithm_identified && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {phase.algorithm_identified}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="flex flex-col gap-3 px-4 pb-4 pl-11">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Observation
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {phase.observations}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Recommendation
                    </p>
                    <p className="mt-1 text-sm text-foreground">
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
