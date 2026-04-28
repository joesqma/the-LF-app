"use client";

import { useState } from "react";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { removeBookmark } from "~/lib/actions/bookmarks";
import { cn } from "~/lib/utils";
import type { Bookmark } from "~/types/database";

interface Props {
  initialBookmarks: Bookmark[];
}

export function SavedVideosSection({ initialBookmarks }: Props) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [pendingRemove, setPendingRemove] = useState<Bookmark | null>(null);
  const [removing, setRemoving] = useState(false);

  async function handleConfirmRemove() {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await removeBookmark(pendingRemove.video_url);
      setBookmarks((prev) => prev.filter((b) => b.id !== pendingRemove.id));
      setPendingRemove(null);
    } finally {
      setRemoving(false);
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          No saved videos yet. Bookmark lessons or analysis clips to find them
          here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {bookmarks.map((b) => {
          const tag = b.topic_tag ?? b.method_tag;
          return (
            <div
              key={b.id}
              className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {b.source && (
                    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      {b.source}
                    </span>
                  )}
                  {tag && (
                    <span className="inline-flex shrink-0 items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {tag}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPendingRemove(b)}
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-xs text-muted-foreground transition-colors",
                    "opacity-0 group-hover:opacity-100",
                    "hover:bg-destructive/10 hover:text-destructive",
                  )}
                >
                  Remove
                </button>
              </div>
              <p className="text-sm font-medium text-foreground">{b.title}</p>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!pendingRemove}
        title="Remove video?"
        description="This video will be removed from your library."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        disabled={removing}
        onConfirm={handleConfirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </>
  );
}
