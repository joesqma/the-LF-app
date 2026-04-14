"use client";

import { useEffect, useRef, useState } from "react";
import { ScrambleDisplay } from "~/components/timer/ScrambleDisplay";
import { TimerDisplay } from "~/components/timer/TimerDisplay";
import { useTimer } from "~/hooks/useTimer";
import { generateScramble } from "~/utils/scramble";

export default function TimerPage() {
  const [scramble, setScramble] = useState(() => generateScramble());
  const { phase, displayTime, color, timeMs, resetTimer, touchHandlers } =
    useTimer({ inspectionEnabled: false });

  // Generate a fresh scramble as soon as a solve is recorded
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current === "running" && phase === "stopped") {
      setScramble(generateScramble());
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  function handleNewScramble() {
    setScramble(generateScramble());
    resetTimer();
  }

  return (
    // touch-none prevents browser scroll/zoom while using the timer on mobile
    // role="application" tells AT this is a widget with custom interaction
    <div
      role="application"
      aria-label="Speedcubing timer"
      className="flex h-[100dvh] touch-none select-none flex-col items-center justify-center gap-10"
      onContextMenu={(e) => e.preventDefault()}
      {...touchHandlers}
    >
      <ScrambleDisplay scramble={scramble} onNew={handleNewScramble} />

      <TimerDisplay phase={phase} displayTime={displayTime} color={color} />

      <div className="flex flex-col items-center gap-1">
        {(phase === "idle" || phase === "stopped") && (
          <p className="text-xs text-muted-foreground">
            Hold{" "}
            <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
              Space
            </kbd>{" "}
            to start · tap screen on mobile
          </p>
        )}
        {phase === "running" && (
          <p className="text-xs text-muted-foreground">
            Press{" "}
            <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
              Space
            </kbd>{" "}
            to stop
          </p>
        )}
        {phase === "stopped" && timeMs !== null && (
          <p className="mt-2 text-sm text-muted-foreground">
            Solve logged ·{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={handleNewScramble}
            >
              reset
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
