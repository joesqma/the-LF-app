"use client";

import {
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Settings,
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
    <div className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-4">
      {/* Puzzle dropdown */}
      <div className="relative" ref={puzzleDropdownRef}>
        <button
          type="button"
          onClick={() => setPuzzleOpen((o) => !o)}
          className={cn(
            "flex h-8 items-center gap-1 rounded-full px-4 text-sm font-medium transition-colors",
            puzzleOpen
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {activePuzzle}
          <ChevronDown className="h-3 w-3 shrink-0" />
        </button>

        {puzzleOpen && (
          <div className="absolute left-0 top-8 z-50 min-w-32 rounded-xl border border-border bg-card shadow-sm">
            <ul className="py-1">
              {PUZZLES.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => {
                      onPuzzleChange(p);
                      setPuzzleOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent"
                  >
                    <Check
                      className={cn(
                        "h-3 w-3 shrink-0",
                        p === activePuzzle ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <span className="mx-1 text-border">|</span>

      {/* Session dropdown */}
      <div className="relative" ref={sessionDropdownRef}>
        <button
          type="button"
          onClick={() => setSessionOpen((o) => !o)}
          className={cn(
            "flex h-8 items-center gap-1 rounded-full px-4 text-sm font-medium transition-colors",
            sessionOpen
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <span className="max-w-32 truncate">{activeSession.name}</span>
          <ChevronDown className="h-3 w-3 shrink-0" />
        </button>

        {sessionOpen && (
          <div className="absolute left-0 top-8 z-50 min-w-48 rounded-xl border border-border bg-card shadow-sm">
            <ul className="py-1">
              {sessions.map((s) => (
                <li key={s.id} className="group flex items-center gap-1 px-2">
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
                      className="flex-1 rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground outline-none focus:border-ring"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSessionChange(s.id);
                        setSessionOpen(false);
                      }}
                      onDoubleClick={() => startRename(s)}
                      className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent"
                    >
                      <Check
                        className={cn(
                          "h-3 w-3 shrink-0",
                          s.id === activeSession.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span className="flex-1 truncate">{s.name}</span>
                    </button>
                  )}
                  {renamingId !== s.id &&
                    (confirmDeleteId === s.id ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSession(s.id);
                            setConfirmDeleteId(null);
                            if (s.id === activeSession.id)
                              setSessionOpen(false);
                          }}
                          className="rounded px-1.5 py-0.5 text-xs text-destructive hover:bg-destructive hover:text-white"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startRename(s)}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                          title="Rename"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {sessions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(s.id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-2 py-1">
              <button
                type="button"
                onClick={() => {
                  onCreateSession();
                  setSessionOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                New session
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {importSlot}

      {/* Settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Timer settings"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}
