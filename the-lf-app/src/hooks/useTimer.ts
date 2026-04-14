"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatTime } from "~/utils/timer";

export type TimerPhase =
  | "idle"
  | "holding"
  | "inspection"
  | "running"
  | "stopped";

export type TimerColor = "default" | "green" | "yellow" | "red";

interface Options {
  inspectionEnabled?: boolean;
}

export interface TimerResult {
  phase: TimerPhase;
  displayTime: string;
  color: TimerColor;
  timeMs: number | null;
  resetTimer: () => void;
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

const HOLD_DELAY_MS = 300;

export function useTimer({
  inspectionEnabled = true,
}: Options = {}): TimerResult {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [displayTime, setDisplayTime] = useState("0.00");
  const [color, setColor] = useState<TimerColor>("default");
  const [timeMs, setTimeMs] = useState<number | null>(null);

  // Refs hold authoritative state for use inside event handlers.
  // Using state directly would cause stale closures in the keydown/keyup listeners.
  const phaseRef = useRef<TimerPhase>("idle");
  const timeMsRef = useRef<number | null>(null);
  const holdStartRef = useRef(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const inspIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );
  const inspEnabledRef = useRef(inspectionEnabled);
  inspEnabledRef.current = inspectionEnabled;

  /** Sync both the ref and the React state. */
  const syncPhase = useCallback((p: TimerPhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const syncTimeMs = useCallback((v: number | null) => {
    timeMsRef.current = v;
    setTimeMs(v);
  }, []);

  // ── RAF loop ────────────────────────────────────────────────────────────────

  const stopRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  // ── Inspection interval ─────────────────────────────────────────────────────

  const stopInspection = useCallback(() => {
    if (inspIntervalRef.current !== undefined) {
      clearInterval(inspIntervalRef.current);
      inspIntervalRef.current = undefined;
    }
  }, []);

  // ── Start timer ─────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    stopInspection();
    // Capture start time synchronously — no async between here and display
    startTimeRef.current = performance.now();
    syncPhase("running");
    setColor("default");
    setDisplayTime("0.00");

    function tick() {
      const elapsed = performance.now() - startTimeRef.current;
      setDisplayTime(formatTime(Math.floor(elapsed)));
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [stopInspection, syncPhase]);

  // ── Inspection countdown ────────────────────────────────────────────────────

  const startInspection = useCallback(() => {
    stopInspection();
    let remaining = 15;
    setDisplayTime("15");
    syncPhase("inspection");
    setColor("default");

    inspIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setDisplayTime(String(Math.max(remaining, 0)));

      if (remaining <= 3) {
        setColor("red");
      } else if (remaining <= 8) {
        setColor("yellow");
      }

      if (remaining <= 0) {
        stopInspection();
        startTimer();
      }
    }, 1000);
  }, [stopInspection, syncPhase, startTimer]);

  // ── Input handlers ──────────────────────────────────────────────────────────

  const handleDown = useCallback(() => {
    const p = phaseRef.current;

    if (p === "running") {
      // Stop timer — synchronous capture, no async gap
      const elapsed = Math.floor(performance.now() - startTimeRef.current);
      stopRaf();
      syncTimeMs(elapsed);
      setDisplayTime(formatTime(elapsed));
      syncPhase("stopped");
      setColor("default");
      return;
    }

    if (p === "idle" || p === "stopped") {
      holdStartRef.current = performance.now();
      syncPhase("holding");
      setColor("green");
      return;
    }

    if (p === "inspection") {
      // Register hold-start so spacebar-up can start the timer
      holdStartRef.current = performance.now();
    }
  }, [stopRaf, syncTimeMs, syncPhase]);

  const handleUp = useCallback(() => {
    const p = phaseRef.current;

    if (p === "holding") {
      const held = performance.now() - holdStartRef.current;
      if (held >= HOLD_DELAY_MS) {
        inspEnabledRef.current ? startInspection() : startTimer();
      } else {
        // Short tap — cancel back to previous resting phase
        syncPhase(timeMsRef.current !== null ? "stopped" : "idle");
        setColor("default");
      }
      return;
    }

    if (p === "inspection" && holdStartRef.current > 0) {
      const held = performance.now() - holdStartRef.current;
      if (held >= HOLD_DELAY_MS) {
        holdStartRef.current = 0;
        startTimer();
      }
    }
  }, [startInspection, startTimer, syncPhase]);

  // ── Stable handler ref (avoids stale closures in the keydown/up listener) ──

  const handlersRef = useRef({ handleDown, handleUp });
  handlersRef.current = { handleDown, handleUp };

  // ── Keyboard listeners ──────────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      handlersRef.current.handleDown();
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      e.preventDefault();
      handlersRef.current.handleUp();
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopRaf();
      stopInspection();
    };
  }, [stopRaf, stopInspection]);

  // ── Public API ──────────────────────────────────────────────────────────────

  const resetTimer = useCallback(() => {
    stopRaf();
    stopInspection();
    syncPhase("idle");
    setColor("default");
    syncTimeMs(null);
    setDisplayTime("0.00");
  }, [stopRaf, stopInspection, syncPhase, syncTimeMs]);

  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      handlersRef.current.handleDown();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      handlersRef.current.handleUp();
    },
  };

  return { phase, displayTime, color, timeMs, resetTimer, touchHandlers };
}
