"use client";

import { Bookmark, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CubeNet } from "~/components/timer/CubeNet";
import { ImportButton } from "~/components/timer/ImportButton";
import type { Solve } from "~/components/timer/SessionPanel";
import { SessionPanel } from "~/components/timer/SessionPanel";
import {
  DEFAULT_SETTINGS,
  type TimerSettings,
  TimerSettingsPanel,
} from "~/components/timer/TimerSettings";
import type { Session } from "~/components/timer/TimerTopBar";
import { TimerTopBar } from "~/components/timer/TimerTopBar";
import { useUser } from "~/hooks/useUser";
import {
  createSession,
  deleteSession,
  deleteSolve,
  getSessions,
  getSolves,
  renameSession,
  saveScrambleToLibrary,
  saveSolve,
  updateSolvePenalty,
} from "~/lib/actions/timer";
import { cn } from "~/lib/utils";
import type { Database } from "~/types/database";
import { generateScrambleForPuzzle, type Puzzle } from "~/utils/scrambleMulti";

// ── storage (settings + puzzle only) ─────────────────────────────────────────

const STORAGE_KEY = "cubewise_timer_prefs";

interface StoredPrefs {
  activePuzzle: Puzzle;
  settings: TimerSettings;
}

function loadPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { activePuzzle: "3×3", settings: DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    return {
      activePuzzle: parsed.activePuzzle ?? "3×3",
      settings: parsed.settings
        ? { ...DEFAULT_SETTINGS, ...parsed.settings }
        : DEFAULT_SETTINGS,
    };
  } catch {
    return { activePuzzle: "3×3", settings: DEFAULT_SETTINGS };
  }
}

// ── types ─────────────────────────────────────────────────────────────────────

type DbSession = Database["public"]["Tables"]["solve_sessions"]["Row"];
type DbSolve = Database["public"]["Tables"]["solves"]["Row"];

function toUiSession(s: DbSession): Session {
  return {
    id: s.id,
    name: s.name,
    createdAt: new Date(s.created_at).getTime(),
  };
}

function dbSolveToUi(s: DbSolve): Solve {
  return {
    id: s.id,
    time: s.time_ms / 1000,
    scramble: s.scramble ?? "",
    puzzle: "3×3",
    sessionId: s.session_id,
    createdAt: new Date(s.created_at).getTime(),
    penalty: s.penalty === "dnf" ? "DNF" : s.penalty,
  };
}

// ── timer helpers ─────────────────────────────────────────────────────────────

type TimerPhase =
  | "idle"
  | "holding"
  | "ready"
  | "inspecting"
  | "running"
  | "done";

function fmtSecs(secs: number): string {
  if (secs < 60) return secs.toFixed(2);
  const m = Math.floor(secs / 60);
  return `${m}:${(secs % 60).toFixed(2).padStart(5, "0")}`;
}

// Parses typing-mode input into seconds.
// Digit-only strings are interpreted as a compact time:
//   ≤2 digits  → 0.xx        (e.g. "59"    → 0.59)
//   3–4 digits → ss.xx       (e.g. "905"   → 9.05, "1220" → 12.20)
//   ≥5 digits  → m:ss.xx     (e.g. "12134" → 1:21.34)
// Also accepts "ss.xx" and "m:ss.xx" text formats.
function parseTypeInTime(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;

  if (/^\d+$/.test(s)) {
    const len = s.length;
    let mins = 0,
      secs = 0,
      hundredths = 0;
    if (len <= 2) {
      hundredths = parseInt(s, 10);
    } else if (len <= 4) {
      hundredths = parseInt(s.slice(-2), 10);
      secs = parseInt(s.slice(0, -2), 10);
    } else {
      hundredths = parseInt(s.slice(-2), 10);
      secs = parseInt(s.slice(-4, -2), 10);
      mins = parseInt(s.slice(0, -4), 10);
    }
    if (secs >= 60 || hundredths >= 100) return null;
    return mins * 60 + secs + hundredths / 100;
  }

  if (/^\d+\.\d{0,2}$/.test(s)) {
    const v = parseFloat(s);
    return Number.isNaN(v) || v <= 0 ? null : v;
  }

  const colonMatch = s.match(/^(\d+):(\d{1,2})\.(\d{1,2})$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10);
    const secs = parseInt(colonMatch[2], 10);
    const hund = parseInt(colonMatch[3].padEnd(2, "0"), 10);
    if (secs >= 60) return null;
    return mins * 60 + secs + hund / 100;
  }

  return null;
}

const PHASE_COLOR: Record<TimerPhase, string> = {
  idle: "text-foreground",
  done: "text-foreground",
  holding: "text-foreground/50",
  ready: "text-green-400 dark:text-green-400",
  running: "text-foreground",
  inspecting: "text-foreground",
};

// ── component ─────────────────────────────────────────────────────────────────

export default function TimerPage() {
  const { user } = useUser();

  // ── db state ─────────────────────────────────────────────────────────────

  const [dbSessions, setDbSessions] = useState<DbSession[]>([]);
  const [dbSolves, setDbSolves] = useState<DbSolve[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");

  // ── local prefs state ─────────────────────────────────────────────────────

  const [activePuzzle, setActivePuzzle] = useState<Puzzle>("3×3");
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Load prefs from localStorage
  useEffect(() => {
    const prefs = loadPrefs();
    setActivePuzzle(prefs.activePuzzle);
    setSettings(prefs.settings);
    setHydrated(true);
  }, []);

  // Persist prefs
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activePuzzle, settings }),
    );
  }, [hydrated, activePuzzle, settings]);

  // ── load sessions when user is available ─────────────────────────────────

  useEffect(() => {
    if (!user) return;
    getSessions(user.id)
      .then(async (rows) => {
        if (rows.length === 0) {
          const s = await createSession(user.id, "Session 1");
          setDbSessions([s]);
          setActiveSessionId(s.id);
        } else {
          setDbSessions(rows);
          setActiveSessionId(rows[0].id);
        }
      })
      .catch(console.error);
  }, [user]);

  // Load solves when active session changes
  useEffect(() => {
    if (!activeSessionId) return;
    getSolves(activeSessionId).then(setDbSolves).catch(console.error);
  }, [activeSessionId]);

  // ── scramble state ────────────────────────────────────────────────────────

  const [scramble, setScramble] = useState(() =>
    generateScrambleForPuzzle("3×3"),
  );
  const [scrambleHistory, setScrambleHistory] = useState<string[]>([]);

  function nextScramble(puzzle = activePuzzle) {
    setScrambleHistory((h) => [scramble, ...h].slice(0, 50));
    setScramble(generateScrambleForPuzzle(puzzle));
    setScrambleSaved(false);
  }

  function prevScramble() {
    if (scrambleHistory.length === 0) return;
    const [prev, ...rest] = scrambleHistory;
    setScramble(prev);
    setScrambleHistory(rest);
    setScrambleSaved(false);
  }

  // ── timer state ───────────────────────────────────────────────────────────

  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [displaySecs, setDisplaySecs] = useState(0);
  const [inspectionRemaining, setInspectionRemaining] = useState(0);
  const [typeInValue, setTypeInValue] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrambleSaved, setScrambleSaved] = useState(false);

  const typeInInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings.inputMethod === "typing") typeInInputRef.current?.focus();
  }, [settings.inputMethod]);

  const phaseRef = useRef<TimerPhase>("idle");
  const displaySecsRef = useRef(0);
  const startTimeRef = useRef(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const inspectedRef = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  function syncPhase(p: TimerPhase) {
    phaseRef.current = p;
    setPhase(p);
  }

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function clearInterval_() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function clearInspectionInterval_() {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
  }

  // ── solve recording ───────────────────────────────────────────────────────

  const activeSolveRefs = useRef({
    activeSessionId,
    activePuzzle,
    scramble,
    userId: user?.id,
  });
  activeSolveRefs.current = {
    activeSessionId,
    activePuzzle,
    scramble,
    userId: user?.id,
  };

  const recordSolve = useCallback((timeSecs: number) => {
    const {
      activeSessionId: sid,
      scramble: scr,
      userId,
    } = activeSolveRefs.current;
    if (!sid || !userId) return;

    const timeMs = Math.round(timeSecs * 1000);

    // Optimistic: add immediately with a temp id
    const optimistic: DbSolve = {
      id: crypto.randomUUID(),
      user_id: userId,
      session_id: sid,
      time_ms: timeMs,
      penalty: null,
      scramble: scr,
      method: null,
      notes: null,
      created_at: new Date().toISOString(),
    };
    setDbSolves((prev) => [optimistic, ...prev]);

    // Persist and swap optimistic row with real DB row
    saveSolve(sid, userId, timeMs, scr)
      .then((saved) =>
        setDbSolves((prev) =>
          prev.map((s) => (s.id === optimistic.id ? saved : s)),
        ),
      )
      .catch(console.error);

    setScrambleHistory((h) => [scr, ...h].slice(0, 50));
    setScramble(
      generateScrambleForPuzzle(activeSolveRefs.current.activePuzzle),
    );
  }, []);

  // ── spacebar state machine ─────────────────────────────────────────────────

  // biome-ignore lint/correctness/useExhaustiveDependencies: all mutable state accessed via refs
  const handleDown = useCallback(() => {
    const p = phaseRef.current;

    if (p === "running") {
      clearInterval_();
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const rounded = Math.round(elapsed * 1000) / 1000;
      displaySecsRef.current = rounded;
      setDisplaySecs(rounded);
      syncPhase("done");
      recordSolve(rounded);
      return;
    }

    if (p === "inspecting") {
      clearInspectionInterval_();
      inspectedRef.current = true;
      syncPhase("holding");
      setDisplaySecs(0);
      clearHoldTimer();
      holdTimerRef.current = setTimeout(() => {
        if (phaseRef.current === "holding") syncPhase("ready");
      }, settingsRef.current.holdThresholdMs);
      return;
    }

    if (p === "idle" || p === "done") {
      inspectedRef.current = false;
      syncPhase("holding");
      setDisplaySecs(0);
      clearHoldTimer();
      holdTimerRef.current = setTimeout(() => {
        if (phaseRef.current === "holding") syncPhase("ready");
      }, settingsRef.current.holdThresholdMs);
    }
  }, [recordSolve]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: all mutable state accessed via refs
  const handleUp = useCallback(() => {
    const p = phaseRef.current;

    if (p === "holding") {
      clearHoldTimer();
      syncPhase("idle");
      return;
    }

    if (p === "ready") {
      clearHoldTimer();
      const { inspectionSecs } = settingsRef.current;
      if (inspectionSecs && !inspectedRef.current) {
        syncPhase("inspecting");
        const startTime = performance.now();
        setInspectionRemaining(inspectionSecs);
        inspectionIntervalRef.current = setInterval(() => {
          const elapsed = (performance.now() - startTime) / 1000;
          setInspectionRemaining(Math.max(0, inspectionSecs - elapsed));
        }, 50);
      } else {
        startTimeRef.current = performance.now();
        syncPhase("running");
        setDisplaySecs(0);
        intervalRef.current = setInterval(() => {
          const elapsed = (performance.now() - startTimeRef.current) / 1000;
          setDisplaySecs(elapsed);
        }, 30);
      }
    }
  }, []);

  const handlersRef = useRef({ handleDown, handleUp });
  handlersRef.current = { handleDown, handleUp };

  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers accessed via stable ref
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat) return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      e.preventDefault();
      handlersRef.current.handleDown();
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      e.preventDefault();
      handlersRef.current.handleUp();
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearInterval_();
      clearHoldTimer();
      clearInspectionInterval_();
    };
  }, []);

  // ── type-in mode ──────────────────────────────────────────────────────────

  function handleTypeIn() {
    const parsed = parseTypeInTime(typeInValue);
    if (parsed !== null && parsed > 0) {
      const rounded = Math.round(parsed * 100) / 100;
      recordSolve(rounded);
      setDisplaySecs(rounded);
      syncPhase("done");
    }
    setTypeInValue("");
  }

  // ── session management ────────────────────────────────────────────────────

  async function handleCreateSession() {
    if (!user) return;
    const maxN = dbSessions.reduce((max, s) => {
      const match = s.name.match(/^Session (\d+)$/);
      return match ? Math.max(max, Number.parseInt(match[1], 10)) : max;
    }, 0);
    const s = await createSession(user.id, `Session ${maxN + 1}`);
    setDbSessions((prev) => [s, ...prev]);
    setActiveSessionId(s.id);
    setDbSolves([]);
  }

  async function handleRenameSession(id: string, name: string) {
    await renameSession(id, name);
    setDbSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s)),
    );
  }

  async function handleDeleteSession(id: string) {
    await deleteSession(id);
    setDbSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeSessionId === id && next.length > 0) {
        setActiveSessionId(next[0].id);
      }
      return next;
    });
    if (activeSessionId === id) setDbSolves([]);
  }

  function handleSessionChange(id: string) {
    setActiveSessionId(id);
  }

  async function handleImportComplete() {
    if (!user) return;
    const rows = await getSessions(user.id);
    setDbSessions(rows);
    if (rows.length > 0) setActiveSessionId(rows[0].id);
  }

  function handlePuzzleChange(puzzle: Puzzle) {
    setActivePuzzle(puzzle);
    nextScramble(puzzle);
    if (phaseRef.current === "running") clearInterval_();
    syncPhase("idle");
  }

  // ── solve actions ─────────────────────────────────────────────────────────

  function handleDeleteSolve(id: string) {
    setDbSolves((prev) => prev.filter((s) => s.id !== id));
    deleteSolve(id).catch(console.error);
  }

  async function handleSaveScramble() {
    if (!user || scrambleSaved) return;
    setScrambleSaved(true);
    saveScrambleToLibrary(user.id, scramble, activePuzzle).catch(() =>
      setScrambleSaved(false),
    );
  }

  function handleSetPenalty(id: string, uiPenalty: null | "+2" | "DNF") {
    const dbPenalty = uiPenalty === "DNF" ? "dnf" : uiPenalty;
    setDbSolves((prev) =>
      prev.map((s) => (s.id === id ? { ...s, penalty: dbPenalty } : s)),
    );
    updateSolvePenalty(id, dbPenalty).catch(console.error);
  }

  // ── derived ───────────────────────────────────────────────────────────────

  const uiSessions = dbSessions.map(toUiSession);
  const activeSession = dbSessions.find((s) => s.id === activeSessionId);

  const focusMode =
    settings.inputMethod === "timer" &&
    (phase === "holding" ||
      phase === "ready" ||
      phase === "inspecting" ||
      phase === "running");

  if (!hydrated) return null;

  return (
    <div
      role="application"
      aria-label="Speedcubing timer"
      className="flex h-full flex-col overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={(e) => {
        e.preventDefault();
        if ((e.target as HTMLElement).tagName !== "INPUT") handleDown();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        if ((e.target as HTMLElement).tagName !== "INPUT") handleUp();
      }}
    >
      {focusMode ? (
        /* Focus mode: only the timer, aligned with normal mode position */
        <div className="flex h-full select-none items-center justify-center touch-none pt-14">
          {phase === "inspecting" ? (
            <div
              className={cn(
                "font-mono font-light tabular-nums leading-none tracking-tight",
                "text-[80px]",
                inspectionRemaining > 3
                  ? "text-foreground"
                  : "text-red-400 dark:text-red-400",
              )}
              style={{ letterSpacing: "-3px" }}
            >
              {Math.ceil(inspectionRemaining)}
            </div>
          ) : (
            <div
              className={cn(
                "font-mono font-light tabular-nums leading-none tracking-tight transition-colors duration-75",
                "text-[80px]",
                PHASE_COLOR[phase],
              )}
              style={{ letterSpacing: "-3px" }}
            >
              {fmtSecs(displaySecs)}
            </div>
          )}
        </div>
      ) : (
        /* Normal mode */
        <>
          {/* Top bar */}
          <TimerTopBar
            activePuzzle={activePuzzle}
            activeSession={
              uiSessions.find((s) => s.id === activeSessionId) ??
              uiSessions[0] ?? { id: "", name: "Loading…", createdAt: 0 }
            }
            sessions={uiSessions}
            onPuzzleChange={handlePuzzleChange}
            onSessionChange={handleSessionChange}
            onCreateSession={handleCreateSession}
            onRenameSession={handleRenameSession}
            onDeleteSession={handleDeleteSession}
            onOpenSettings={() => setSettingsOpen(true)}
            importSlot={
              user ? (
                <ImportButton
                  userId={user.id}
                  onImportComplete={handleImportComplete}
                />
              ) : null
            }
          />

          {/* Body: center + right panel */}
          <div className="flex flex-1 overflow-hidden">
            {/* Timer center */}
            <div className="relative flex flex-1 select-none flex-col touch-none">
              {/* Timer display — absolute so it centers over the full area */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                {settings.inputMethod === "typing" ? (
                  /* Type-in mode */
                  <div className="flex flex-col items-center gap-4">
                    <input
                      ref={typeInInputRef}
                      type="text"
                      value={typeInValue}
                      onChange={(e) => setTypeInValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleTypeIn();
                        if (e.key === "Escape") setTypeInValue("");
                      }}
                      placeholder="1220 or 12.34"
                      className="w-48 rounded-lg border border-border bg-transparent px-4 py-2 text-center font-mono text-2xl text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                    {typeInValue &&
                      (() => {
                        const preview = parseTypeInTime(typeInValue);
                        return (
                          <span className="font-mono text-sm text-muted-foreground">
                            {preview !== null ? fmtSecs(preview) : "invalid"}
                          </span>
                        );
                      })()}
                    <button
                      type="button"
                      onClick={handleTypeIn}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  /* Spacebar mode */
                  <div
                    className={cn(
                      "font-mono font-light tabular-nums leading-none tracking-tight transition-colors duration-75",
                      "text-[80px]",
                      PHASE_COLOR[phase],
                    )}
                    style={{ letterSpacing: "-3px" }}
                  >
                    {fmtSecs(displaySecs)}
                  </div>
                )}
              </div>

              {/* Scramble bar — relative z-10 so it sits above the absolute timer display */}
              <div className="relative z-10 flex flex-col items-center justify-center gap-2 bg-background px-6 py-3">
                <p className="max-w-4xl whitespace-pre-wrap text-center font-mono text-base leading-relaxed tracking-wide text-foreground sm:text-lg">
                  {scramble}
                </p>
                <div className="flex shrink-0 items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={prevScramble}
                    disabled={scrambleHistory.length === 0}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
                    title="Previous scramble"
                  >
                    <RefreshCw className="h-3.5 w-3.5 -scale-x-100" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveScramble}
                    disabled={!user || scrambleSaved}
                    className={cn(
                      "rounded-md p-1 transition-colors disabled:opacity-30",
                      scrambleSaved
                        ? "text-orange-400"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                    title={
                      scrambleSaved
                        ? "Saved to library"
                        : "Save scramble to library"
                    }
                  >
                    <Bookmark
                      className={cn(
                        "h-3.5 w-3.5",
                        scrambleSaved && "fill-current",
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => nextScramble()}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    title="Next scramble"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Cube net — bottom right */}
              {settings.showCubeNet && activePuzzle === "3×3" && (
                <div className="absolute bottom-4 right-4">
                  <div className="h-[220px] w-[300px] rounded-xl border border-border bg-card p-3 shadow-[8px_8px_0px_hsl(var(--border))]">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden">
                      <CubeNet scramble={scramble} scale={1.2} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Session panel (original UI) */}
            {activeSession && (
              <SessionPanel
                sessionName={activeSession.name}
                solves={dbSolves.map(dbSolveToUi)}
                onDeleteSolve={handleDeleteSolve}
                onSetPenalty={handleSetPenalty}
              />
            )}
          </div>
        </>
      )}

      {/* Settings modal */}
      {settingsOpen && (
        <TimerSettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
