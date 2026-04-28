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

  if (status === "pending" || status === "processing") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Analysing your solve…
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gemini is watching frame-by-frame. Usually takes 10–30 seconds.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          {(["p1", "p2", "p3", "p4", "p5"] as const).map((k) => (
            <div
              key={k}
              className="h-12 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-start gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Analysis failed
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong processing your video. You can try again or
            upload a new video.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={retryAnalysis}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Try Again
          </button>
          <Link
            href="/analysis"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            New analysis
          </Link>
        </div>
      </div>
    );
  }

  if (status === "complete" && report) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <p className="text-xs text-muted-foreground">
            {analysis.method?.toUpperCase()} · {formatDate(analysis.created_at)}
          </p>
          <Link
            href="/analysis"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← New analysis
          </Link>
        </div>

        {videoUrl && (
          // biome-ignore lint/a11y/useMediaCaption: user-uploaded solve video, captions not applicable
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full rounded-xl border border-border bg-black"
            style={{ maxHeight: "360px" }}
          />
        )}

        <AnalysisSummaryCard
          summary={report.overall_summary}
          estimatedTime={report.estimated_total_time}
          topPriorities={report.top_priorities}
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
