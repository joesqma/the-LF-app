"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnalysisSummaryCard } from "~/components/analysis/AnalysisSummaryCard";
import { ChatPanel } from "~/components/analysis/ChatPanel";
import { PhaseBreakdown } from "~/components/analysis/PhaseBreakdown";
import { RecommendedLessons } from "~/components/analysis/RecommendedLessons";
import type { AnalysisReport } from "~/types/analysis";
import type { Analysis } from "~/types/database";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  analysis: Analysis;
  videoUrl: string | null;
  initialMessages: {
    id: string;
    role: "user" | "assistant";
    content: string;
  }[];
  userTier: "free" | "premium" | "lifetime";
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div
      style={{
        height: `${height}px`,
        background: "var(--s1)",
        border: "0.5px solid var(--b1)",
        borderRadius: "12px",
        opacity: 0.6,
      }}
    />
  );
}

export function AnalysisResultClient({
  analysis,
  videoUrl,
  initialMessages,
  userTier,
}: Props) {
  const [status, setStatus] = useState(analysis.status);
  const [report, setReport] = useState<AnalysisReport | null>(
    (analysis.report ?? null) as unknown as AnalysisReport | null,
  );
  const hasTriggered = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const seekTo = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.play().catch(() => {});
  }, []);

  const triggerAnalysis = useCallback(async () => {
    await fetch("/api/analysis/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId: analysis.id }),
    });
  }, [analysis.id]);

  useEffect(() => {
    if (
      !hasTriggered.current &&
      (status === "pending" || status === "processing")
    ) {
      hasTriggered.current = true;
      void triggerAnalysis();
    }
  }, [status, triggerAnalysis]);

  useEffect(() => {
    if (status === "complete" || status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analysis/${analysis.id}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: Analysis["status"];
          report?: AnalysisReport;
        };
        setStatus(data.status);
        if (data.status === "complete" && data.report) {
          setReport(data.report);
        }
      } catch {
        // ignore transient errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, analysis.id]);

  function retryAnalysis() {
    hasTriggered.current = true;
    setStatus("processing");
    void triggerAnalysis();
  }

  // ── Processing state ───────────────────────────────────────────────────────

  if (status === "pending" || status === "processing") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ marginBottom: "20px" }}>
          <p
            style={{
              ...sans,
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--t1)",
              letterSpacing: "-0.5px",
            }}
          >
            Analysing your solve…
          </p>
          <p
            style={{
              ...sans,
              fontSize: "13px",
              fontWeight: 400,
              color: "var(--t3)",
              marginTop: "4px",
            }}
          >
            Gemini is watching frame-by-frame. Usually takes 10–30 seconds.
          </p>
        </div>
        <SkeletonBlock height={160} />
        <SkeletonBlock height={48} />
        <SkeletonBlock height={48} />
        <SkeletonBlock height={48} />
        <SkeletonBlock height={48} />
      </div>
    );
  }

  // ── Failed state ──────────────────────────────────────────────────────────

  if (status === "failed") {
    return (
      <div>
        <div
          style={{
            position: "relative",
            background: "var(--s1)",
            border: "0.5px solid var(--b2)",
            borderRadius: "14px",
            padding: "20px 22px",
            overflow: "hidden",
            marginBottom: "16px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "var(--red)",
            }}
          />
          <p
            style={{
              ...sans,
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--t1)",
              marginBottom: "6px",
            }}
          >
            Analysis failed
          </p>
          <p
            style={{
              ...sans,
              fontSize: "13px",
              fontWeight: 400,
              color: "var(--t3)",
              lineHeight: 1.6,
            }}
          >
            Something went wrong processing your video. You can retry or upload
            a new video.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={retryAnalysis}
            className="cb-primary-btn"
          >
            Try again
          </button>
          <Link href="/analysis" className="cb-ghost-btn">
            New analysis
          </Link>
        </div>
      </div>
    );
  }

  // ── Complete state ────────────────────────────────────────────────────────

  if (status === "complete" && report) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                ...mono,
                fontSize: "9px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                background: "var(--blue-dim)",
                color: "var(--blue)",
                borderRadius: "20px",
                padding: "2px 8px",
              }}
            >
              {analysis.method?.toUpperCase() ?? "CFOP"}
            </span>
            <span
              style={{
                ...mono,
                fontSize: "11px",
                fontWeight: 400,
                color: "var(--t3)",
              }}
            >
              {formatDate(analysis.created_at)}
            </span>
          </div>
          <Link
            href="/analysis"
            style={{
              ...mono,
              fontSize: "11px",
              fontWeight: 400,
              color: "var(--t3)",
              textDecoration: "none",
              transition: "color 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--t2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--t3)";
            }}
          >
            ← New analysis
          </Link>
        </div>

        {/* Video */}
        {videoUrl && (
          // biome-ignore lint/a11y/useMediaCaption: user-uploaded solve video, captions not applicable
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            style={{
              width: "100%",
              borderRadius: "14px",
              border: "0.5px solid var(--b2)",
              background: "#000",
              maxHeight: "400px",
              display: "block",
            }}
          />
        )}

        <AnalysisSummaryCard
          summary={report.overall_summary}
          estimatedTime={report.estimated_total_time}
          topPriorities={report.top_priorities}
          scramble={analysis.scramble}
        />

        <PhaseBreakdown phases={report.phases} onSeek={seekTo} />

        <RecommendedLessons lessonIds={report.recommended_lesson_ids} />

        <ChatPanel
          analysisId={analysis.id}
          initialMessages={initialMessages}
          userTier={userTier}
        />
      </div>
    );
  }

  return null;
}
