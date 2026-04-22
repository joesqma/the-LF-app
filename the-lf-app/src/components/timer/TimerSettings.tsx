"use client";

import { X } from "lucide-react";
import { cn } from "~/lib/utils";

export interface TimerSettings {
  holdThresholdMs: number;
  showCubeNet: boolean;
  inspectionSecs: number | null;
  inputMethod: "timer" | "typing";
}

export const DEFAULT_SETTINGS: TimerSettings = {
  holdThresholdMs: 300,
  showCubeNet: true,
  inspectionSecs: null,
  inputMethod: "timer",
};

interface TimerSettingsPanelProps {
  settings: TimerSettings;
  onChange: (s: TimerSettings) => void;
  onClose: () => void;
}

export function TimerSettingsPanel({
  settings,
  onChange,
  onClose,
}: TimerSettingsPanelProps) {
  function set<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="w-full max-w-xs rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Timer Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Input method */}
          <div>
            <p className="mb-2 text-xs font-medium text-foreground">
              Input method
            </p>
            <div className="flex gap-2">
              {(["timer", "typing"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => set("inputMethod", method)}
                  className={cn(
                    "h-7 flex-1 rounded-md border text-xs font-medium transition-colors",
                    settings.inputMethod === method
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
                  )}
                >
                  {method === "timer" ? "Spacebar" : "Typing"}
                </button>
              ))}
            </div>
          </div>

          {/* Hold threshold — only relevant for spacebar mode */}
          {settings.inputMethod === "timer" && (
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">
                Hold threshold
              </p>
              <div className="flex gap-2">
                {([150, 300, 500] as const).map((ms) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => set("holdThresholdMs", ms)}
                    className={cn(
                      "h-7 flex-1 rounded-md border text-xs font-medium transition-colors",
                      settings.holdThresholdMs === ms
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
                    )}
                  >
                    {ms}ms
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inspection — only relevant for spacebar mode */}
          {settings.inputMethod === "timer" && (
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">
                Inspection time
              </p>
              <div className="flex gap-2">
                {([null, 8, 12, 15] as const).map((secs) => (
                  <button
                    key={String(secs)}
                    type="button"
                    onClick={() => set("inspectionSecs", secs)}
                    className={cn(
                      "h-7 flex-1 rounded-md border text-xs font-medium transition-colors",
                      settings.inspectionSecs === secs
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
                    )}
                  >
                    {secs === null ? "Off" : `${secs}s`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show cube net */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">
              Show scramble diagram
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={settings.showCubeNet}
              onClick={() => set("showCubeNet", !settings.showCubeNet)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                settings.showCubeNet ? "bg-foreground" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
                  settings.showCubeNet ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
