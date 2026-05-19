"use client";

import { useEffect, useRef, useState } from "react";
import { deleteAccount, resetOnboarding } from "~/lib/actions/account";
import { cn } from "~/lib/utils";

const INSPECTION_KEY = "cubewise-inspection-enabled";
const INSPECTION_AUDIO_KEY = "cubewise-inspection-audio";
const HOLD_DURATION_KEY = "cubewise-hold-duration";

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

interface Props {
  email: string | null;
  wcaId: string | null;
}

export function SettingsClient({ email, wcaId }: Props) {
  const [inspectionEnabled, setInspectionEnabled] = useState(false);
  const [inspectionAudio, setInspectionAudio] = useState(false);
  const [holdDuration, setHoldDuration] = useState(300);
  const [mounted, setMounted] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting">(
    "idle",
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [retaking, setRetaking] = useState(false);
  const confirmInputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    const storedInspection = localStorage.getItem(INSPECTION_KEY);
    if (storedInspection !== null)
      setInspectionEnabled(storedInspection === "true");
    const storedAudio = localStorage.getItem(INSPECTION_AUDIO_KEY);
    if (storedAudio !== null) setInspectionAudio(storedAudio === "true");
    const storedHold = localStorage.getItem(HOLD_DURATION_KEY);
    if (storedHold !== null) setHoldDuration(Number(storedHold));
  }, []);

  function toggleInspection() {
    const next = !inspectionEnabled;
    setInspectionEnabled(next);
    localStorage.setItem(INSPECTION_KEY, String(next));
  }

  function toggleInspectionAudio() {
    const next = !inspectionAudio;
    setInspectionAudio(next);
    localStorage.setItem(INSPECTION_AUDIO_KEY, String(next));
  }

  function handleHoldChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setHoldDuration(val);
    localStorage.setItem(HOLD_DURATION_KEY, String(val));
  }

  async function handleRetakeOnboarding() {
    setRetaking(true);
    await resetOnboarding();
  }

  async function handleDeleteConfirm() {
    setDeleteStep("deleting");
    setDeleteError(null);
    const result = await deleteAccount();
    if (result && "error" in result) {
      setDeleteError(result.error);
      setDeleteStep("confirm");
    }
  }

  if (!mounted) return null;

  return (
    <div className="flex max-w-lg flex-col gap-8">
      {/* Appearance */}
      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Appearance
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-foreground">Dark mode</p>
              <p className="text-xs text-muted-foreground">
                Always on — light mode coming in V2
              </p>
            </div>
            <Toggle value={true} onToggle={() => {}} disabled />
          </div>
        </div>
      </section>

      {/* Timer preferences */}
      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Timer
        </p>
        <div className="flex flex-col gap-3">
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

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-foreground">
                Inspection audio
              </p>
              <p className="text-xs text-muted-foreground">
                Play "8" and "12" second alerts
              </p>
            </div>
            <Toggle
              value={inspectionAudio}
              onToggle={toggleInspectionAudio}
              disabled={!inspectionEnabled}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Hold to start
                </p>
                <p className="text-xs text-muted-foreground">
                  How long to hold before the timer arms
                </p>
              </div>
              <span className="text-sm font-medium text-foreground">
                {holdDuration}ms
              </span>
            </div>
            <input
              type="range"
              min={200}
              max={500}
              step={10}
              value={holdDuration}
              onChange={handleHoldChange}
              className="w-full accent-foreground"
            />
            <div className="mt-1 flex justify-between">
              <span className="text-xs text-muted-foreground">200ms</span>
              <span className="text-xs text-muted-foreground">500ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* Linked accounts */}
      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Linked accounts
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-foreground">Google</p>
              <p className="text-xs text-muted-foreground">
                {email ?? "Not connected"}
              </p>
            </div>
            <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-foreground">WCA</p>
              <p className="text-xs text-muted-foreground">
                {wcaId ? `ID: ${wcaId}` : "Not linked"}
              </p>
            </div>
            {wcaId ? (
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                Linked
              </span>
            ) : (
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                Not linked
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Account */}
      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Account
        </p>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-foreground">
              Retake onboarding
            </p>
            <p className="text-xs text-muted-foreground">
              Update your skill level and preferences
            </p>
          </div>
          <button
            type="button"
            onClick={handleRetakeOnboarding}
            disabled={retaking}
            className="ml-4 shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {retaking ? "Redirecting…" : "Retake"}
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-red-500">
          Danger zone
        </p>
        <div className="rounded-xl border border-red-900/40 bg-card p-4 shadow-sm">
          {deleteStep === "idle" && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Delete account
                </p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all data. This cannot be
                  undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteStep("confirm")}
                className="ml-4 shrink-0 rounded-lg border border-red-900/60 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/40"
              >
                Delete account
              </button>
            </div>
          )}

          {deleteStep === "confirm" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-foreground">
                Are you sure? This will permanently delete your account, all
                solves, analyses, and bookmarks.
              </p>
              {deleteError && (
                <p className="text-xs text-red-400">{deleteError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  ref={confirmInputRef}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
                >
                  Yes, delete my account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteStep("idle");
                    setDeleteError(null);
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteStep === "deleting" && (
            <p className="text-sm text-muted-foreground">
              Deleting your account…
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
