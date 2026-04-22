"use client";

import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

const INSPECTION_KEY = "cubewise-inspection-enabled";

function Toggle({
  value,
  onToggle,
  disabled,
}: {
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative h-[22px] w-10 rounded-full border transition-colors",
        value
          ? "border-foreground bg-foreground"
          : "border-border bg-transparent",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] h-4 w-4 rounded-full transition-[left]",
          value
            ? "left-[22px] bg-background"
            : "left-[2px] bg-muted-foreground",
        )}
      />
    </button>
  );
}

export function SettingsClient() {
  const [inspectionEnabled, setInspectionEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(INSPECTION_KEY);
    if (stored !== null) setInspectionEnabled(stored === "true");
  }, []);

  function toggleInspection() {
    const next = !inspectionEnabled;
    setInspectionEnabled(next);
    localStorage.setItem(INSPECTION_KEY, String(next));
  }

  if (!mounted) return null;

  return (
    <div className="flex max-w-lg flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <p className="text-sm font-medium text-foreground">Dark mode</p>
          <p className="text-xs text-muted-foreground">
            Always on \u2014 light mode coming in V2
          </p>
        </div>
        <Toggle value={true} onToggle={() => {}} disabled />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <p className="text-sm font-medium text-foreground">
            Inspection countdown
          </p>
          <p className="text-xs text-muted-foreground">
            WCA-standard 15s before each solve
          </p>
        </div>
        <Toggle value={inspectionEnabled} onToggle={toggleInspection} />
      </div>
    </div>
  );
}
