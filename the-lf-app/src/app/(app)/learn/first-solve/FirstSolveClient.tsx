"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FirstSolveStep } from "~/lib/content/first-solve";

type StepState = "done" | "current" | "todo" | "locked";

type StepWithState = FirstSolveStep & { state: StepState };

interface Props {
  steps: StepWithState[];
  initialStepId: number;
}

export function FirstSolveClient({
  steps: initialSteps,
  initialStepId,
}: Props) {
  const [steps, setSteps] = useState<StepWithState[]>(initialSteps);
  const [activeStepId, setActiveStepId] = useState(initialStepId);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  const activeStep = steps.find((s) => s.id === activeStepId) ?? steps[0];
  const completedCount = steps.filter((s) => s.state === "done").length;

  // Reset video tab when step changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on step change
  useEffect(() => {
    setActiveVideoIdx(0);
  }, [activeStepId]);

  const handleStepClick = useCallback(
    (stepId: number) => {
      const step = steps.find((s) => s.id === stepId);
      if (!step || step.state === "locked") return;
      setActiveStepId(stepId);
    },
    [steps],
  );

  const handleGotIt = useCallback(async () => {
    const step = activeStep;
    if (step.state === "done") return;

    const key = `first-solve-${step.id}`;

    // Optimistic update
    setSteps((prev) => {
      let currentAssigned = false;
      let todoAssigned = false;
      const newCompleted = new Set(
        prev
          .filter((s) => s.state === "done")
          .map((s) => `first-solve-${s.id}`),
      );
      newCompleted.add(key);

      return prev.map((s) => {
        const sKey = `first-solve-${s.id}`;
        if (newCompleted.has(sKey)) return { ...s, state: "done" as StepState };
        if (!currentAssigned) {
          currentAssigned = true;
          todoAssigned = false;
          return { ...s, state: "current" as StepState };
        }
        if (!todoAssigned) {
          todoAssigned = true;
          return { ...s, state: "todo" as StepState };
        }
        return { ...s, state: "locked" as StepState };
      });
    });

    // Advance to next step
    const nextStep = steps.find((s) => s.id === step.id + 1);
    if (nextStep) setActiveStepId(nextStep.id);

    // Persist to server
    try {
      await fetch("/api/learn/first-solve/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: key }),
      });
    } catch {
      // Optimistic — ignore transient errors
    }
  }, [activeStep, steps]);

  const currentVideo =
    activeStep.videos[activeVideoIdx] ?? activeStep.videos[0];
  const embedUrl = currentVideo
    ? `https://www.youtube-nocookie.com/embed/${currentVideo.videoId}?start=${currentVideo.startSeconds}&rel=0&modestbranding=1`
    : null;

  const progressPct =
    steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {/* ── Column 1: Step Sidebar ── */}
      <div
        style={{
          width: "232px",
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            padding: "20px 18px 16px",
            flexShrink: 0,
          }}
        >
          <Link
            href="/learn"
            className="font-dm-sans fs-back-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "var(--text-dimmer)",
              textDecoration: "none",
              marginBottom: "14px",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 2L3.5 5.5L7 9"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Learn
          </Link>

          <p
            className="font-syne"
            style={{
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--text-secondary)",
              marginBottom: "4px",
            }}
          >
            The First Solve
          </p>

          <p
            className="font-dm-sans"
            style={{
              fontSize: "11px",
              fontWeight: 300,
              color: "var(--text-dimmer)",
              marginBottom: "8px",
            }}
          >
            {completedCount} of {steps.length} steps done
          </p>

          <div
            style={{
              height: "2px",
              background: "#1d1d1d",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Step list */}
        <div
          className="fs-sidebar-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}
        >
          {steps.map((step) => {
            const isActive = step.id === activeStepId;
            const isLocked = step.state === "locked";

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`fs-step-row font-dm-sans ${isActive ? "fs-step-row-active" : ""} ${isLocked ? "fs-step-row-locked" : ""}`}
                style={{ width: "100%", textAlign: "left" }}
              >
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "6px",
                      bottom: "6px",
                      width: "2px",
                      background: "#3b82f6",
                      borderRadius: "0 2px 2px 0",
                    }}
                  />
                )}
                <StepCircle state={step.state} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: isActive
                        ? "var(--text-secondary)"
                        : "var(--text-dim)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: "1px",
                    }}
                  >
                    {step.name}
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "var(--text-dimmer)",
                    }}
                  >
                    {step.videos.length === 1
                      ? "1 video"
                      : `${step.videos.length} videos`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Column 2: Main Content ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Step header */}
        <div
          style={{
            padding: "22px 32px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              className="font-dm-sans"
              style={{
                fontSize: "10px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-dimmer)",
                marginBottom: "6px",
              }}
            >
              Step {activeStep.id + 1} of {steps.length}
            </p>
            <h1
              className="font-syne"
              style={{
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                marginBottom: "5px",
              }}
            >
              {activeStep.name}
            </h1>
            <p
              className="font-dm-sans"
              style={{
                fontSize: "12px",
                fontWeight: 300,
                color: "var(--text-dim)",
                lineHeight: 1.65,
                maxWidth: "520px",
              }}
            >
              {activeStep.desc}
            </p>
          </div>

          {activeStep.state === "done" ? (
            <div
              className="font-dm-sans"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: "#0d2818",
                color: "#22c55e",
                border: "1px solid #14532d",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "12px",
                fontWeight: 500,
                whiteSpace: "nowrap",
                flexShrink: 0,
                cursor: "default",
              }}
            >
              ✓ Completed
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleGotIt()}
              className="font-dm-sans fs-got-it-btn"
              style={{ flexShrink: 0 }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                aria-hidden="true"
              >
                <polyline
                  points="1.5,6.5 5,10 11.5,2.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Got it — next step
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div
          className="fs-content-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "20px 32px 40px",
            minWidth: 0,
          }}
        >
          {/* Video source tabs (only when >1 video) */}
          {activeStep.videos.length > 1 && (
            <div style={{ display: "flex", gap: "5px", marginBottom: "14px" }}>
              {activeStep.videos.map((video, idx) => {
                const isActive = idx === activeVideoIdx;
                return (
                  <button
                    key={`${video.source}-${video.videoId}`}
                    type="button"
                    onClick={() => setActiveVideoIdx(idx)}
                    className={`font-dm-sans fs-video-tab ${isActive ? "fs-video-tab-active" : ""}`}
                  >
                    {video.source}
                    <span
                      style={{
                        fontSize: "10px",
                        color: isActive ? "#3a5a80" : "var(--text-dimmer)",
                      }}
                    >
                      · {video.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Video embed */}
          {embedUrl && (
            <div
              style={{
                position: "relative",
                width: "100%",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid var(--border)",
                background: "#000",
                marginBottom: "16px",
                paddingTop: "56.25%",
              }}
            >
              <iframe
                key={embedUrl}
                src={embedUrl}
                title={`${activeStep.name} — ${currentVideo.source}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          )}

          {/* Video metadata row */}
          {currentVideo && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
              }}
            >
              <p
                className="font-dm-sans"
                style={{
                  fontSize: "11px",
                  fontWeight: 300,
                  color: "var(--text-dimmer)",
                }}
              >
                Video by{" "}
                <span style={{ color: "var(--text-dim)" }}>
                  {currentVideo.source}
                </span>
              </p>
              <div
                className="font-dm-sans"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  color: "#3b82f6",
                  background: "#0d1a2e",
                  border: "1px solid #1d3557",
                  padding: "3px 10px",
                  borderRadius: "20px",
                }}
              >
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    flexShrink: 0,
                  }}
                />
                {currentVideo.label}
              </div>
            </div>
          )}

          {/* Key points */}
          <p
            className="font-dm-sans"
            style={{
              fontSize: "10px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-dimmer)",
              marginBottom: "10px",
            }}
          >
            Key points for this step
          </p>
          {activeStep.keyPoints.map((point) => (
            <div
              key={point}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#3b82f6",
                  flexShrink: 0,
                  marginTop: "6px",
                }}
              />
              <p
                className="font-dm-sans"
                style={{
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "var(--text-dim)",
                  lineHeight: 1.6,
                }}
              >
                {point}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepCircle({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "#0d2818",
          border: "1.5px solid #14532d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="9"
          height="7"
          viewBox="0 0 9 7"
          fill="none"
          aria-hidden="true"
        >
          <polyline
            points="1,3.5 3.5,6 8,1"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (state === "current") {
    return (
      <div
        className="fs-circle-current"
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "#0d1f35",
          border: "1.5px solid #1d4ed8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "#3b82f6",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        background: "#111",
        border: "1.5px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "#2a2a2a",
        }}
      />
    </div>
  );
}
