import { notFound, redirect } from "next/navigation";
import { PageShell } from "~/components/layout/PageShell";
import { LessonCompleteButton } from "~/components/learn/LessonCompleteButton";
import { SaveToLibraryButton } from "~/components/learn/SaveToLibraryButton";
import { compPrepLessons } from "~/lib/content/comp-prep";
import { createClient } from "~/lib/supabase/server";

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/);
  if (!match) return url;
  return `https://www.youtube-nocookie.com/embed/${match[1]}`;
}

interface Props {
  params: Promise<{ lessonId: string }>;
}

export default async function CompPrepLessonPage({ params }: Props) {
  const { lessonId } = await params;

  const lessonIndex = compPrepLessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) notFound();
  const lesson = compPrepLessons[lessonIndex];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: bookmarkRows }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("completed_lessons")
      .eq("id", user.id)
      .single(),
    supabase.from("bookmarks").select("video_url").eq("user_id", user.id),
  ]);

  const completed = (profile?.completed_lessons as string[] | null) ?? [];
  const bookmarkedUrls = new Set((bookmarkRows ?? []).map((b) => b.video_url));

  // No sequential lock for comp-prep

  const isCompleted = completed.includes(lessonId);
  const nextLesson = compPrepLessons[lessonIndex + 1] ?? null;
  const nextLessonHref = nextLesson
    ? `/learn/comp-prep/${nextLesson.id}`
    : null;

  return (
    <PageShell
      title={lesson.title}
      subtitle={`${lesson.estimatedMinutes} min · Competition Prep · ${lesson.phase}`}
    >
      <div className="flex max-w-2xl flex-col gap-8">
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
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {video.title} — {video.source}
                  </p>
                  <SaveToLibraryButton
                    videoUrl={video.url}
                    title={video.title}
                    source={video.source}
                    topicTag="competition"
                    isBookmarked={bookmarkedUrls.has(video.url)}
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        <section>
          <p className="text-sm text-muted-foreground">{lesson.description}</p>
        </section>

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

        <LessonCompleteButton
          lessonId={lessonId}
          isCompleted={isCompleted}
          nextLessonHref={nextLessonHref}
        />
      </div>
    </PageShell>
  );
}
