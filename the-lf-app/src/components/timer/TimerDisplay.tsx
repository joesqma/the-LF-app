import type { TimerColor, TimerPhase } from "~/hooks/useTimer";
import { cn } from "~/lib/utils";

interface TimerDisplayProps {
  phase: TimerPhase;
  displayTime: string;
  color: TimerColor;
}

const COLOR_CLASS: Record<TimerColor, string> = {
  default: "text-foreground",
  green: "text-green-500 dark:text-green-400",
  yellow: "text-yellow-500 dark:text-yellow-400",
  red: "text-red-500 dark:text-red-400",
};

export function TimerDisplay({ phase, displayTime, color }: TimerDisplayProps) {
  const isResting = phase === "idle" || phase === "holding";
  const text = isResting ? "READY" : displayTime;

  return (
    <div
      className={cn(
        "select-none font-mono text-8xl font-semibold tabular-nums leading-none tracking-tight transition-colors duration-100 sm:text-9xl",
        COLOR_CLASS[color],
      )}
    >
      {text}
    </div>
  );
}
