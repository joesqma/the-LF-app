"use client";

import { ArrowRight, Bookmark, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { saveBookmark } from "~/lib/actions/bookmarks";
import type { Lesson } from "~/lib/content/types";
import type { Recommendation } from "~/lib/recommendations";

const TRACK_LABEL: Record<Lesson["track"], string> = {
  cfop: "CFOP",
  "comp-prep": "COMP PREP",
  "getting-faster": "GETTING FASTER",
};

interface Props {
  recommendation: Recommendation;
  dontKnowHref: string;
}

const ACTION_CONTENT = {
  analysis: {
    title: "Upload your first solve",
    description:
      "Record a solve and get a frame-by-frame AI breakdown of your cross, F2L, OLL, and PLL — with specific drills to fix what's slowing you down.",
    href: "/analysis",
    cta: "Start analysis",
    meta: ["AI ANALYSIS", "~5 min", "Any level"],
  },
  timer: {
    title: "Log your first solve",
    description:
      "Use the built-in timer to record solves and track your progress over time. Your averages update automatically.",
    href: "/timer",
    cta: "Open timer",
    meta: ["TIMER", "Ongoing", "Any level"],
  },
} as const;

export function RecommendedLessonCard({ recommendation, dontKnowHref }: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(lesson: Lesson) {
    const firstVideo = lesson.videos[0];
    if (saved || saving || !firstVideo) return;
    setSaving(true);
    await saveBookmark({
      videoUrl: firstVideo.url,
      title: lesson.title,
      source: firstVideo.source,
      topicTag: lesson.phase,
      methodTag: lesson.track,
    });
    setSaved(true);
    setSaving(false);
  }

  const isLesson = recommendation.kind === "lesson";
  const action = !isLesson ? ACTION_CONTENT[recommendation.kind] : null;

  const href = isLesson
    ? `/learn/${recommendation.lesson.track}/${recommendation.lesson.id}`
    : (action?.href ?? "/");

  const metaPills: string[] = isLesson
    ? [
        TRACK_LABEL[recommendation.lesson.track],
        `~${recommendation.lesson.estimatedMinutes} min`,
        "Beginner",
      ]
    : ((action?.meta as unknown as string[]) ?? []);

  const title = isLesson ? recommendation.lesson.title : (action?.title ?? "");
  const description = isLesson
    ? recommendation.lesson.description
    : (action?.description ?? "");
  const cta = isLesson ? "Start lesson" : (action?.cta ?? "Start");

  return (
    <article className="recommendation-card">
      <div className="recommendation-card__content">
        <div className="recommendation-card__eyebrow">
          <Sparkles size={15} fill="currentColor" />
          <span>Picked for you</span>
        </div>
        <p className="recommendation-card__reason">{recommendation.reason}</p>
        <h2>{title}</h2>
        <p className="recommendation-card__description">{description}</p>

        <div className="recommendation-card__actions">
          <Link href={href} className="cb-primary-btn">
            {cta}
            <ArrowRight size={16} />
          </Link>

          {isLesson && (
            <button
              type="button"
              data-saved={saved}
              onClick={() => handleSave(recommendation.lesson)}
              disabled={saving}
              className="cb-ghost-btn"
            >
              {saved ? <Check size={15} /> : <Bookmark size={15} />}
              {saving ? "Saving…" : saved ? "Saved" : "Save for later"}
            </button>
          )}
        </div>
      </div>

      <div className="recommendation-card__aside">
        <div className="recommendation-card__number">NEXT</div>
        <div className="recommendation-card__meta">
          {metaPills.map((pill) => (
            <span key={pill}>{pill}</span>
          ))}
        </div>
        <Link href={dontKnowHref} className="recommendation-card__help">
          Explore another path <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
