"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";

type TrackId = "cfop" | "roux" | "comp";

const TRACKS: { id: TrackId; name: string }[] = [
  { id: "cfop", name: "CFOP" },
  { id: "roux", name: "Roux" },
  { id: "comp", name: "Competition Prep" },
];

const LESSONS: Record<
  TrackId,
  { title: string; time: string; recommended?: boolean }[]
> = {
  cfop: [
    { title: "Cross efficiency", time: "~10 min" },
    { title: "F2L: 4 basic slots", time: "~25 min" },
    { title: "F2L lookahead drills", time: "~12 min", recommended: true },
    { title: "2-look OLL", time: "~20 min" },
    { title: "Full PLL", time: "~45 min" },
    { title: "Fingertrick optimisation", time: "~15 min" },
  ],
  roux: [
    { title: "First Block (FB)", time: "~18 min" },
    { title: "Second Square (SS)", time: "~12 min" },
    { title: "CMLL", time: "~30 min" },
    { title: "LSE: Edge Orientation", time: "~10 min" },
    { title: "LSE: UL/UR & EP", time: "~14 min" },
  ],
  comp: [
    { title: "Reading a WCA scorecard", time: "~5 min" },
    { title: "Avoiding +2 penalties", time: "~7 min" },
    { title: "Pre-competition routines", time: "~10 min" },
    { title: "Handling nerves", time: "~8 min" },
  ],
};

export function LearnClient() {
  const [track, setTrack] = useState<TrackId>("cfop");
  const trackLabel = TRACKS.find((t) => t.id === track)?.name ?? track;

  return (
    <div>
      <div className="mb-6 flex border-b border-border">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTrack(t.id)}
            className={cn(
              "-mb-px px-4 py-2.5 text-sm font-medium transition-colors",
              track === t.id
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LESSONS[track].map((lesson, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            key={i}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {trackLabel}
              </span>
              {lesson.recommended && (
                <span className="inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
                  Recommended for you
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground">
              {lesson.title}
            </p>
            <p className="text-xs text-muted-foreground">{lesson.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
