"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FirstSolveStep } from "~/lib/content/first-solve";

type StepState = "done" | "current" | "todo" | "locked";

type StepWithState = FirstSolveStep & { state: StepState };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

type PendingImage = {
  dataUrl: string;
  base64: string;
  mimeType: string;
};

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const activeStep = steps.find((s) => s.id === activeStepId) ?? steps[0];
  const completedCount = steps.filter((s) => s.state === "done").length;

  // Reset video tab and chat when step changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on step change
  useEffect(() => {
    setActiveVideoIdx(0);
    setChatMessages([]);
    setChatInput("");
    setChatError(false);
    setPendingImage(null);
  }, [activeStepId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll trigger
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

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

  const handlePhotoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // dataUrl: "data:<mimeType>;base64,<data>"
        const [header, base64] = dataUrl.split(",");
        const mimeType = header.split(":")[1].split(";")[0];
        setPendingImage({ dataUrl, base64, mimeType });
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const sendChat = useCallback(async () => {
    const trimmed = chatInput.trim();
    if ((!trimmed && !pendingImage) || chatLoading) return;
    const imageSnapshot = pendingImage;
    setChatInput("");
    setPendingImage(null);
    setChatError(false);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      imageUrl: imageSnapshot?.dataUrl,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/learn/first-solve/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed || "I've attached a photo of my cube.",
          stepId: activeStep.id,
          imageBase64: imageSnapshot?.base64,
          imageMimeType: imageSnapshot?.mimeType,
        }),
      });
      if (!res.ok) {
        setChatError(true);
        return;
      }
      const data = (await res.json()) as { reply: string };
      setChatMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply },
      ]);
    } catch {
      setChatError(true);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, pendingImage, chatLoading, activeStep.id]);

  function handleChatKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim() || pendingImage) void sendChat();
    }
  }

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

      {/* ── Column 3: AI Chat Panel ── */}
      <div
        style={{
          width: "288px",
          flexShrink: 0,
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Chat header */}
        <div
          style={{
            padding: "14px 16px 12px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 1h12v9H8l-1.5 2L5 10H1V1z"
                stroke="var(--text-dim)"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="font-dm-sans"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-muted)",
              }}
            >
              Ask your coach
            </span>
          </div>
          <p
            className="font-dm-sans"
            style={{
              fontSize: "11px",
              fontWeight: 300,
              color: "var(--text-dimmer)",
              marginTop: "2px",
            }}
          >
            Stuck on this step? Ask anything.
          </p>

          {/* Step context chip */}
          <div
            className="font-dm-sans"
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              background: "#0d1a2e",
              border: "1px solid #1d3557",
              borderRadius: "8px",
              fontSize: "11px",
              color: "#3a5a80",
              display: "flex",
              alignItems: "center",
              gap: "6px",
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
            Currently on: {activeStep.name}
          </div>
        </div>

        {/* Message list */}
        <div
          className="fs-chat-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {chatMessages.length === 0 &&
          !chatLoading &&
          !chatError &&
          !pendingImage ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  opacity: 0.25,
                  marginBottom: "10px",
                }}
              >
                💬
              </div>
              <p
                className="font-dm-sans"
                style={{
                  fontSize: "11px",
                  fontWeight: 300,
                  color: "var(--text-dimmer)",
                  lineHeight: 1.65,
                }}
              >
                Ask your AI coach anything about this step — algorithms,
                technique, or why something isn&apos;t clicking.
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className="font-dm-sans"
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {msg.imageUrl && (
                  // biome-ignore lint/performance/noImgElement lint/a11y/useAltText: data URL — next/image does not support data URLs
                  <img
                    src={msg.imageUrl}
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid #1d3557",
                      objectFit: "cover",
                      maxHeight: "160px",
                    }}
                  />
                )}
                {msg.content && (
                  <div
                    style={
                      msg.role === "user"
                        ? {
                            padding: "9px 12px",
                            fontSize: "12px",
                            lineHeight: 1.6,
                            background: "#0d1a2e",
                            border: "1px solid #1d3557",
                            color: "var(--text-secondary)",
                            borderRadius: "10px 10px 3px 10px",
                            whiteSpace: "pre-wrap",
                          }
                        : {
                            padding: "9px 12px",
                            fontSize: "12px",
                            lineHeight: 1.6,
                            background: "#111",
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            borderRadius: "10px 10px 10px 3px",
                            whiteSpace: "pre-wrap",
                          }
                    }
                  >
                    {msg.content}
                  </div>
                )}
              </div>
            ))
          )}

          {chatLoading && (
            <div
              style={{
                alignSelf: "flex-start",
                padding: "9px 12px",
                background: "#111",
                border: "1px solid var(--border)",
                borderRadius: "10px 10px 10px 3px",
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}
            >
              <div className="fs-typing-dot" />
              <div
                className="fs-typing-dot"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="fs-typing-dot"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          )}

          {chatError && (
            <p
              className="font-dm-sans"
              style={{
                fontSize: "11px",
                color: "#ef4444",
                textAlign: "center",
                padding: "8px",
              }}
            >
              Coach is unavailable — try again in a moment.
            </p>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {/* Pending image preview */}
          {pendingImage && (
            <div
              style={{
                padding: "8px 12px 0",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <div style={{ position: "relative", display: "inline-block" }}>
                {/* biome-ignore lint/performance/noImgElement lint/a11y/useAltText: data URL — next/image does not support data URLs */}
                <img
                  src={pendingImage.dataUrl}
                  style={{
                    height: "56px",
                    width: "56px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    border: "1px solid #1d3557",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  aria-label="Remove photo"
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#ef4444",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 1l6 6M7 1L1 7"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Input row */}
          <div
            style={{
              padding: "10px 12px",
              display: "flex",
              gap: "6px",
            }}
          >
            {/* Hidden file input */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {/* Photo attach button */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={chatLoading}
              className="fs-photo-btn"
              aria-label="Attach photo"
              title="Attach a photo of your cube"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="1"
                  y="3"
                  width="12"
                  height="9"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <circle
                  cx="7"
                  cy="7.5"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M5 3V2.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V3"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              </svg>
            </button>

            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Ask about this step..."
              disabled={chatLoading}
              className="fs-chat-input font-dm-sans"
            />
            <button
              type="button"
              onClick={() => void sendChat()}
              disabled={(!chatInput.trim() && !pendingImage) || chatLoading}
              className="fs-send-btn"
              aria-label="Send message"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 7h12M7 1l6 6-6 6"
                  stroke="#000"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
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
