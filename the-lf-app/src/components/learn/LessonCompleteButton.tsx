"use client";

import Link from "next/link";
import { useState } from "react";
import { completeLesson } from "~/lib/actions/learn";
import { cn } from "~/lib/utils";

interface Props {
  lessonId: string;
  isCompleted: boolean;
  nextLessonHref: string | null;
}

export function LessonCompleteButton({
  lessonId,
  isCompleted,
  nextLessonHref,
}: Props) {
  const [done, setDone] = useState(isCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setLoading(true);
    setError(null);
    const result = await completeLesson(lessonId);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] text-background">
            ✓
          </span>
          Lesson complete
        </div>
        {nextLessonHref ? (
          <Link
            href={nextLessonHref}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Next Lesson →
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">
            You've finished this track. Great work!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleComplete}
        disabled={loading}
        className={cn(
          "self-start rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity",
          loading ? "opacity-50" : "hover:opacity-80",
        )}
      >
        {loading ? "Saving…" : "Mark as Complete"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
