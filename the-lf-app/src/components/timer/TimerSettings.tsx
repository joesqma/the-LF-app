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
    <div className="timer-modal-backdrop">
      <div className="timer-modal timer-settings-modal">
        <div className="timer-modal__header">
          <div>
            <span className="timer-modal__eyebrow">Preferences</span>
            <h2>Timer settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="timer-modal__close"
            aria-label="Close timer settings"
          >
            <X size={17} />
          </button>
        </div>

        <div className="timer-settings-list">
          <section className="timer-settings-group">
            <p>Input method</p>
            <div className="timer-settings-segment">
              {(["timer", "typing"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => set("inputMethod", method)}
                  className={cn(settings.inputMethod === method && "is-active")}
                >
                  {method === "timer" ? "Spacebar" : "Typing"}
                </button>
              ))}
            </div>
          </section>

          {settings.inputMethod === "timer" && (
            <section className="timer-settings-group">
              <p>Hold threshold</p>
              <div className="timer-settings-segment timer-settings-segment--numeric">
                {([150, 300, 500] as const).map((ms) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => set("holdThresholdMs", ms)}
                    className={cn(
                      settings.holdThresholdMs === ms && "is-active",
                    )}
                  >
                    {ms}ms
                  </button>
                ))}
              </div>
            </section>
          )}

          {settings.inputMethod === "timer" && (
            <section className="timer-settings-group">
              <p>Inspection time</p>
              <div className="timer-settings-segment timer-settings-segment--numeric">
                {([null, 8, 12, 15] as const).map((secs) => (
                  <button
                    key={String(secs)}
                    type="button"
                    onClick={() => set("inspectionSecs", secs)}
                    className={cn(
                      settings.inspectionSecs === secs && "is-active",
                    )}
                  >
                    {secs === null ? "Off" : `${secs}s`}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="timer-settings-toggle">
            <p>Scramble diagram</p>
            <button
              type="button"
              role="switch"
              aria-checked={settings.showCubeNet}
              onClick={() => set("showCubeNet", !settings.showCubeNet)}
              className={cn("timer-switch", settings.showCubeNet && "is-on")}
            >
              <span />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
