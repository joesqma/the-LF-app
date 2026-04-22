"use client";

import { useState } from "react";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { deleteSavedScramble } from "~/lib/actions/timer";
import { cn } from "~/lib/utils";
import type { SavedScramble } from "~/types/database";

interface Props {
  initialScrambles: SavedScramble[];
}

export function SavedScramblesSection({ initialScrambles }: Props) {
  const [scrambles, setScrambles] = useState(initialScrambles);
  const [pendingDelete, setPendingDelete] = useState<SavedScramble | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteSavedScramble(pendingDelete.id);
      setScrambles((prev) => prev.filter((s) => s.id !== pendingDelete.id));
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {scrambles.length === 0 ? (
        <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            No saved scrambles yet. Use the bookmark icon on the timer to save
            one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {scrambles.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
            >
              <p className="flex-1 truncate font-mono text-sm text-foreground">
                {s.scramble}
              </p>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {s.puzzle}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => setPendingDelete(s)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs text-muted-foreground transition-colors",
                    "opacity-0 group-hover:opacity-100",
                    "hover:bg-destructive/10 hover:text-destructive",
                  )}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove scramble?"
        description="This scramble will be removed from your library."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        disabled={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
