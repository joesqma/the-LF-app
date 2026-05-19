"use client";

import Link from "next/link";
import { useState } from "react";
import { saveBookmark } from "~/lib/actions/bookmarks";
import type { Lesson } from "~/lib/content/types";
import type { Recommendation } from "~/lib/recommendations";

const TRACK_LABEL: Record<Lesson["track"], string> = {
  cfop: "CFOP",
  roux: "ROUX",
  "comp-prep": "COMP PREP",
  "getting-faster": "GETTING FASTER",
};

interface Props {
  recommendation: Recommendation;
  dontKnowHref: string;
}

// ── Non-lesson variants ──────────────────────────────────────────────────────

const ACTION_CONTENT = {
  analysis: {
    title: "Upload your first solve",
    description:
      "Record a solve and get a frame-by-frame AI breakdown of your cross, F2L, OLL, and PLL — with specific drills to fix what's slowing you down.",
    href: "/analysis",
    cta: "Start analysis →",
    meta: "AI ANALYSIS",
  },
  timer: {
    title: "Log your first solve",
    description:
      "Use the built-in timer to record solves and track your progress over time. Your averages update automatically.",
    href: "/timer",
    cta: "Open timer →",
    meta: "TIMER",
  },
} as const;

// ── Component ────────────────────────────────────────────────────────────────

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

  const meta = isLesson
    ? `${TRACK_LABEL[recommendation.lesson.track]} · ~${recommendation.lesson.estimatedMinutes} MIN`
    : action?.meta;

  return (
    <div
      className="db-rec-card py-6 px-5 md:py-[32px] md:px-[36px]"
      style={{ marginBottom: "40px" }}
    >
      {/* Top accent gradient line */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, #3b82f6 40%, #8b5cf6 70%, transparent)",
          opacity: 0.7,
        }}
      />

      {/* Corner glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-60px",
          right: "-60px",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header row: AI label + meta */}
      <div style={{ marginBottom: "16px" }}>
        <div className="flex items-center" style={{ gap: "6px" }}>
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--accent-blue)",
              flexShrink: 0,
            }}
          />
          <span
            className="font-dm-sans"
            style={{
              color: "var(--accent-blue)",
              fontSize: "11px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            AI Recommendation
          </span>
        </div>

        <p
          className="mt-2 font-dm-sans md:absolute md:top-[32px] md:right-[36px]"
          style={{
            color: "var(--text-dimmer)",
            fontWeight: 400,
            letterSpacing: "0.06em",
          }}
        >
          <span className="text-[11px] md:text-[12px]">{meta}</span>
        </p>
      </div>

      {/* Reason pill */}
      <p
        className="font-dm-sans"
        style={{
          fontSize: "12px",
          fontWeight: 400,
          color: "var(--text-dimmer)",
          marginBottom: "10px",
          fontStyle: "italic",
        }}
      >
        {recommendation.reason}
      </p>

      {/* Title */}
      <h3
        className="font-syne"
        style={{
          fontSize: "26px",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          color: "var(--text-primary)",
          marginBottom: "10px",
        }}
      >
        {isLesson ? recommendation.lesson.title : action?.title}
      </h3>

      {/* Description */}
      <p
        className="font-dm-sans"
        style={{
          fontSize: "14px",
          fontWeight: 300,
          color: "var(--text-muted)",
          lineHeight: 1.65,
          maxWidth: "600px",
          marginBottom: "28px",
        }}
      >
        {isLesson ? recommendation.lesson.description : action?.description}
      </p>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Link href={href} className="db-primary-btn font-dm-sans">
          {isLesson ? "Start lesson" : action?.cta}
        </Link>

        {isLesson && (
          <button
            type="button"
            data-saved={saved}
            onClick={() => handleSave(recommendation.lesson)}
            disabled={saving}
            className="db-ghost-btn font-dm-sans"
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save for later"}
          </button>
        )}

        <Link
          href={dontKnowHref}
          className="font-dm-sans"
          style={{
            fontSize: "12px",
            fontWeight: 400,
            color: "var(--text-dimmer)",
            textDecoration: "none",
            marginLeft: "auto",
            whiteSpace: "nowrap",
          }}
        >
          Don&apos;t know where to start?
        </Link>
      </div>
    </div>
  );
}
