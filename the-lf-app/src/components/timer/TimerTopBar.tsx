"use client";

import {
  Check,
  ChevronDown,
  Pencil,
  Plus,
  SlidersHorizontal,
  TimerReset,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import type { Puzzle } from "~/utils/scrambleMulti";
import { PUZZLES } from "~/utils/scrambleMulti";

export interface Session {
  id: string;
  name: string;
  createdAt: number;
}

interface TimerTopBarProps {
  activePuzzle: Puzzle;
  activeSession: Session;
  sessions: Session[];
  onPuzzleChange: (puzzle: Puzzle) => void;
  onSessionChange: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (id: string, name: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  importSlot?: React.ReactNode;
}

export function TimerTopBar({
  activePuzzle,
  activeSession,
  sessions,
  onPuzzleChange,
  onSessionChange,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  onOpenSettings,
  importSlot,
}: TimerTopBarProps) {
  const [sessionOpen, setSessionOpen] = useState(false);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const sessionDropdownRef = useRef<HTMLDivElement>(null);
  const puzzleDropdownRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        sessionDropdownRef.current &&
        !sessionDropdownRef.current.contains(e.target as Node)
      ) {
        setSessionOpen(false);
        setRenamingId(null);
        setConfirmDeleteId(null);
      }
      if (
        puzzleDropdownRef.current &&
        !puzzleDropdownRef.current.contains(e.target as Node)
      ) {
        setPuzzleOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  function startRename(session: Session) {
    setRenamingId(session.id);
    setRenameValue(session.name);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      onRenameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }

  return (
    <header className="timer-topbar">
      <div className="timer-topbar__identity">
        <span className="timer-topbar__mark">
          <TimerReset size={18} />
        </span>
        <div>
          <span>Practice</span>
          <strong>Timer</strong>
        </div>
      </div>

      <div className="timer-topbar__selectors">
        <div className="timer-select-wrap" ref={puzzleDropdownRef}>
          <button
            type="button"
            onClick={() => setPuzzleOpen((o) => !o)}
            className={cn(
              "timer-select timer-select--puzzle",
              puzzleOpen && "is-open",
            )}
            aria-expanded={puzzleOpen}
          >
            <span>{activePuzzle}</span>
            <ChevronDown size={14} />
          </button>

          {puzzleOpen && (
            <div className="timer-menu timer-menu--puzzle">
              <ul>
                {PUZZLES.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => {
                        onPuzzleChange(p);
                        setPuzzleOpen(false);
                      }}
                      className={cn(
                        "timer-menu__item font-roboto-mono",
                        p === activePuzzle && "is-active",
                      )}
                    >
                      <Check
                        className={cn(
                          "timer-menu__check",
                          p === activePuzzle ? "opacity-100" : "opacity-0",
                        )}
                        size={13}
                      />
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <span className="timer-topbar__divider" />

        <div className="timer-select-wrap" ref={sessionDropdownRef}>
          <button
            type="button"
            onClick={() => setSessionOpen((o) => !o)}
            className={cn(
              "timer-select timer-select--session",
              sessionOpen && "is-open",
            )}
            aria-expanded={sessionOpen}
          >
            <span>{activeSession.name}</span>
            <ChevronDown size={14} />
          </button>

          {sessionOpen && (
            <div className="timer-menu timer-menu--session">
              <ul>
                {sessions.map((s) => (
                  <li key={s.id} className="timer-menu__session-row group">
                    {renamingId === s.id ? (
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        onBlur={commitRename}
                        className="timer-menu__rename"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSessionChange(s.id);
                          setSessionOpen(false);
                        }}
                        onDoubleClick={() => startRename(s)}
                        className={cn(
                          "timer-menu__item timer-menu__session",
                          s.id === activeSession.id && "is-active",
                        )}
                      >
                        <Check
                          className={cn(
                            "timer-menu__check",
                            s.id === activeSession.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                          size={13}
                        />
                        <span>{s.name}</span>
                      </button>
                    )}
                    {renamingId !== s.id &&
                      (confirmDeleteId === s.id ? (
                        <div className="timer-menu__confirm">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteSession(s.id);
                              setConfirmDeleteId(null);
                              if (s.id === activeSession.id)
                                setSessionOpen(false);
                            }}
                            className="is-destructive"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="timer-menu__row-actions">
                          <button
                            type="button"
                            onClick={() => startRename(s)}
                            title="Rename"
                            aria-label={`Rename ${s.name}`}
                          >
                            <Pencil size={13} />
                          </button>
                          {sessions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(s.id)}
                              title="Delete"
                              aria-label={`Delete ${s.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                  </li>
                ))}
              </ul>
              <div className="timer-menu__footer">
                <button
                  type="button"
                  onClick={() => {
                    onCreateSession();
                    setSessionOpen(false);
                  }}
                  className="timer-menu__item"
                >
                  <Plus size={14} />
                  New session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="timer-topbar__actions">
        {importSlot}
        <button
          type="button"
          onClick={onOpenSettings}
          className="timer-icon-button"
          title="Timer settings"
          aria-label="Timer settings"
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>
    </header>
  );
}
