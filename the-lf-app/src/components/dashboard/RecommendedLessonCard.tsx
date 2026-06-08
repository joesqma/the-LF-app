"use client";

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

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

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
    <div
      style={{
        position: "relative",
        background: "var(--s1)",
        border: "0.5px solid var(--b2)",
        borderRadius: "14px",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "24px",
        padding: "24px",
      }}
    >
      {/* 2px accent bar flush to top */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "var(--blue)",
        }}
      />

      {/* Left: content */}
      <div style={{ minWidth: 0 }}>
        {/* Eyebrow chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            marginBottom: "8px",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--blue)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              ...mono,
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "var(--blue)",
            }}
          >
            AI Recommendation
          </span>
        </div>

        {/* Context / reason */}
        <p
          style={{
            ...sans,
            fontSize: "11px",
            fontWeight: 400,
            color: "var(--t3)",
            marginBottom: "8px",
            lineHeight: 1.4,
          }}
        >
          {recommendation.reason}
        </p>

        {/* Title */}
        <h3
          style={{
            ...sans,
            fontSize: "23px",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            lineHeight: 1.15,
            color: "var(--t1)",
            marginBottom: "8px",
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            ...sans,
            fontSize: "13px",
            fontWeight: 400,
            color: "var(--t2)",
            lineHeight: 1.65,
            marginBottom: "20px",
            maxWidth: "540px",
          }}
        >
          {description}
        </p>

        {/* Button row */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Link href={href} className="cb-primary-btn">
            {cta}
          </Link>

          {isLesson && (
            <button
              type="button"
              data-saved={saved}
              onClick={() => handleSave(recommendation.lesson)}
              disabled={saving}
              className="cb-ghost-btn"
            >
              {saving ? "Saving…" : saved ? "Saved" : "Save for later"}
            </button>
          )}
        </div>
      </div>

      {/* Right: meta pills */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "6px",
          paddingTop: "4px",
          flexShrink: 0,
        }}
      >
        {metaPills.map((pill) => (
          <div
            key={pill}
            style={{
              background: "var(--s2)",
              border: "0.5px solid var(--b2)",
              borderRadius: "6px",
              padding: "4px 10px",
              ...mono,
              fontSize: "10px",
              fontWeight: 400,
              color: "var(--t2)",
              whiteSpace: "nowrap",
            }}
          >
            {pill}
          </div>
        ))}
        <p
          style={{
            ...mono,
            fontSize: "10px",
            fontWeight: 400,
            color: "var(--t3)",
            marginTop: "8px",
            whiteSpace: "nowrap",
          }}
        >
          <Link
            href={dontKnowHref}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            Don&apos;t know where to start?
          </Link>
        </p>
      </div>
    </div>
  );
}
