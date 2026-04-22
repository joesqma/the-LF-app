"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import type { Database } from "~/types/database";
import { effectiveTime, fmtMs } from "~/utils/stats";

export type DbSolve = Database["public"]["Tables"]["solves"]["Row"];

interface SolveListProps {
  solves: DbSolve[];
  onDelete: (id: string) => void;
  onSetPenalty: (id: string, penalty: "dnf" | "+2" | null) => void;
}

interface MenuState {
  solveId: string;
  x: number;
  y: number;
}

export function SolveList({ solves, onDelete, onSetPenalty }: SolveListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menu]);

  if (solves.length === 0) {
    return (
      <p className="px-3 py-4 text-xs text-muted-foreground">No solves yet.</p>
    );
  }

  const menuSolve = menu ? solves.find((s) => s.id === menu.solveId) : null;

  return (
    <>
      {/* Solve rows */}
      <div className="flex-1 overflow-y-auto">
        {solves.map((solve, i) => {
          const et = effectiveTime(solve);
          const isPB = isBestSingle(solves, i);
          return (
            <div key={solve.id}>
              {/* biome-ignore lint/a11y/noStaticElementInteractions: right-click context menu is secondary UX; primary actions use buttons */}
              <div
                className={cn(
                  "group flex items-center gap-1 px-3 py-1 text-xs hover:bg-accent/60",
                  isPB && "text-orange-400",
                )}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({ solveId: solve.id, x: e.clientX, y: e.clientY });
                }}
              >
                <span className="w-5 shrink-0 text-muted-foreground">
                  {solves.length - i}
                </span>
                <button
                  type="button"
                  className="flex-1 truncate text-left font-mono tabular-nums"
                  onClick={() =>
                    setExpandedId(expandedId === solve.id ? null : solve.id)
                  }
                >
                  {fmtMs(et)}
                  {solve.penalty === "+2" && (
                    <span className="ml-0.5 text-[9px] text-muted-foreground">
                      +2
                    </span>
                  )}
                  {solve.penalty === "dnf" && (
                    <span className="ml-0.5 text-[9px] text-destructive">
                      DNF
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenu({
                      solveId: solve.id,
                      x: rect.left,
                      y: rect.bottom + 4,
                    });
                  }}
                  className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </div>

              {/* Expanded scramble */}
              {expandedId === solve.id && solve.scramble && (
                <p className="px-3 pb-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  {solve.scramble}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {menu && menuSolve && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-36 rounded-lg border border-border bg-card py-1 shadow-md"
          style={{ left: menu.x, top: menu.y }}
        >
          {menuSolve.penalty !== "+2" && (
            <button
              type="button"
              onClick={() => {
                onSetPenalty(menu.solveId, "+2");
                setMenu(null);
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent"
            >
              Mark as +2
            </button>
          )}
          {menuSolve.penalty !== "dnf" && (
            <button
              type="button"
              onClick={() => {
                onSetPenalty(menu.solveId, "dnf");
                setMenu(null);
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent"
            >
              Mark as DNF
            </button>
          )}
          {menuSolve.penalty !== null && (
            <button
              type="button"
              onClick={() => {
                onSetPenalty(menu.solveId, null);
                setMenu(null);
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent"
            >
              Remove penalty
            </button>
          )}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              onDelete(menu.solveId);
              setMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-destructive hover:bg-accent"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}
    </>
  );
}

function isBestSingle(solves: DbSolve[], index: number): boolean {
  const et = effectiveTime(solves[index]);
  if (!Number.isFinite(et)) return false;
  for (let i = 0; i < solves.length; i++) {
    if (i === index) continue;
    if (effectiveTime(solves[i]) <= et) return false;
  }
  return true;
}
