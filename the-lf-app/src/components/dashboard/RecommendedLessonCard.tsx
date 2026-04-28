"use client";

import Link from "next/link";
import { useState } from "react";
import { saveBookmark } from "~/lib/actions/bookmarks";
import type { Lesson } from "~/lib/content/types";

const TRACK_LABEL: Record<Lesson["track"], string> = {
  cfop: "CFOP",
  roux: "ROUX",
  "comp-prep": "COMP PREP",
  "getting-faster": "GETTING FASTER",
};

interface Props {
  lesson: Lesson;
}

export function RecommendedLessonCard({ lesson }: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const firstVideo = lesson.videos[0];

  async function handleSave() {
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

  const trackLabel = TRACK_LABEL[lesson.track];

  return (
    <div className="db-rec-card py-6 px-5 md:py-[32px] md:px-[36px]">
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

      {/* Tag pill — meta label sits here in flow on mobile, absolute on desktop */}
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
            Recommended for you
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
          <span className="text-[11px] md:text-[12px]">
            {trackLabel} · ~{lesson.estimatedMinutes} MIN
          </span>
        </p>
      </div>

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
        {lesson.title}
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
        {lesson.description}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Link
          href={`/learn/${lesson.track}/${lesson.id}`}
          className="db-primary-btn font-dm-sans"
        >
          Start lesson
        </Link>
        <button
          type="button"
          data-saved={saved}
          onClick={handleSave}
          disabled={saving}
          className="db-ghost-btn font-dm-sans"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save for later"}
        </button>
      </div>
    </div>
  );
}
