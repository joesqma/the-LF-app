import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "~/components/layout/PageShell";
import { CFOP_PHASES, cfopLessons } from "~/lib/content/cfop";
import { createClient } from "~/lib/supabase/server";
import { cn } from "~/lib/utils";

export default async function CfopTrackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("completed_lessons")
    .eq("id", user.id)
    .single();

  const completed = new Set<string>(
    (profile?.completed_lessons as string[] | null) ?? [],
  );

  return (
    <PageShell
      title="CFOP"
      subtitle={`${completed.size > 0 ? `${[...completed].filter((id) => cfopLessons.some((l) => l.id === id)).length} of ${cfopLessons.length} lessons completed` : `${cfopLessons.length} lessons`}`}
    >
      <div className="flex flex-col gap-8">
        {CFOP_PHASES.map((phase) => {
          const lessons = cfopLessons
            .filter((l) => l.phase === phase)
            .sort((a, b) => a.order - b.order);

          return (
            <section key={phase} className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {phase}
              </h2>
              <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
                {lessons.map((lesson, idx) => {
                  const isDone = completed.has(lesson.id);

                  // A lesson is accessible if it's first in its phase or the previous is done
                  const prevLesson = idx > 0 ? lessons[idx - 1] : null;
                  const isLocked =
                    prevLesson !== null && !completed.has(prevLesson.id);

                  return (
                    <div
                      key={lesson.id}
                      className={cn(
                        "flex items-center gap-3 bg-card px-4 py-3 text-sm",
                        isLocked
                          ? "opacity-40"
                          : "transition-colors hover:bg-accent/50",
                      )}
                    >
                      {/* Completion indicator */}
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                          isDone
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-transparent",
                        )}
                      >
                        ✓
                      </span>

                      {isLocked ? (
                        <span className="flex-1 font-medium text-foreground">
                          {lesson.title}
                        </span>
                      ) : (
                        <Link
                          href={`/learn/cfop/${lesson.id}`}
                          className="flex-1 font-medium text-foreground hover:underline"
                        >
                          {lesson.title}
                        </Link>
                      )}

                      <span className="shrink-0 text-xs text-muted-foreground">
                        {lesson.estimatedMinutes} min
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
