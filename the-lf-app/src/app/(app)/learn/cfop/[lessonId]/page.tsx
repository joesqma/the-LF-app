import { notFound, redirect } from "next/navigation";
import { PageShell } from "~/components/layout/PageShell";
import { LessonCompleteButton } from "~/components/learn/LessonCompleteButton";
import { cfopLessons } from "~/lib/content/cfop";
import { createClient } from "~/lib/supabase/server";

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/);
  if (!match) return url;
  return `https://www.youtube-nocookie.com/embed/${match[1]}`;
}

interface Props {
  params: Promise<{ lessonId: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { lessonId } = await params;

  const lessonIndex = cfopLessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) notFound();
  const lesson = cfopLessons[lessonIndex];

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

  const completed = (profile?.completed_lessons as string[] | null) ?? [];

  // Check sequential access: all lessons in same phase before this one must be done
  const phaseLesSons = cfopLessons
    .filter((l) => l.phase === lesson.phase)
    .sort((a, b) => a.order - b.order);
  const lessonPosInPhase = phaseLesSons.findIndex((l) => l.id === lessonId);
  if (lessonPosInPhase > 0) {
    const prev = phaseLesSons[lessonPosInPhase - 1];
    if (!completed.includes(prev.id)) redirect("/learn/cfop");
  }

  const isCompleted = completed.includes(lessonId);
  const nextLesson = cfopLessons[lessonIndex + 1] ?? null;
  const nextLessonHref = nextLesson ? `/learn/cfop/${nextLesson.id}` : null;

  return (
    <PageShell
      title={lesson.title}
      subtitle={`${lesson.estimatedMinutes} min · CFOP · ${lesson.phase}`}
    >
      <div className="flex max-w-2xl flex-col gap-8">
        {/* Videos */}
        {lesson.videos.length > 0 && (
          <section className="flex flex-col gap-4">
            {lesson.videos.map((video) => (
              <div key={video.url} className="flex flex-col gap-2">
                <div className="overflow-hidden rounded-xl border border-border">
                  <iframe
                    src={getYouTubeEmbedUrl(video.url)}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="aspect-video w-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {video.title} — {video.source}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Description */}
        <section>
          <p className="text-sm text-muted-foreground">{lesson.description}</p>
        </section>

        {/* Tips */}
        {lesson.tips.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-foreground">Tips</h2>
            <ul className="flex flex-col gap-2">
              {lesson.tips.map((tip) => (
                <li
                  key={tip}
                  className="flex gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 shrink-0 text-foreground">·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Complete button */}
        <LessonCompleteButton
          lessonId={lessonId}
          isCompleted={isCompleted}
          nextLessonHref={nextLessonHref}
        />
      </div>
    </PageShell>
  );
}
