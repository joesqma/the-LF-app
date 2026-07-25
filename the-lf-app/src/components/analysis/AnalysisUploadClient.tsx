"use client";

import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { VideoUploader } from "~/components/analysis/VideoUploader";

interface Props {
  userId: string;
  initialMethod: "cfop" | "beginner";
}

const TIPS: Array<{
  label: string;
  color: string;
  angles?: string[];
  angleNote?: string;
  items: string[];
}> = [
  {
    label: "Best Setup",
    color: "var(--green)",
    angleNote: "Set the camera so the cube and hands are clearly visible.",
    angles: ["face-on", "POV", "diagonal"],
    items: [
      "Position the cube in the blue box",
      "Use a plain, contrasting surface to solve on.",
      "Film in good, even lighting with no harsh shadows across the cube face.",
      "Keep the camera completely still",
    ],
  },
  {
    label: "Alternatives",
    color: "var(--yellow)",
    items: [
      "Film from a 45° angle slightly above eye level. Make sure all layers are partially visible.",
      "Film from the front at eye level (may miss top-layer details)",
      "Avoid filming from below or the side (sticker colours become ambiguous)",
    ],
  },
  {
    label: "Avoid",
    color: "var(--red)",
    items: [
      "Don't cover the cube with your palms mid-solve (Hold the sides and rotate using your fingers)",
      "Don't film in direct sunlight",
      "Don't cut off your hands at the edges of the camera frame",
    ],
  },
];

const mono: React.CSSProperties = {
  fontFamily: "var(--font-roboto-mono), 'Roboto Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-roboto-mono), 'Roboto Mono', monospace",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "2.5px",
  textTransform: "uppercase",
  color: "var(--t3)",
  marginBottom: "14px",
};

const fieldLabel: React.CSSProperties = {
  fontFamily: "var(--font-roboto-mono), 'Roboto Mono', monospace",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: "var(--t3)",
  marginBottom: "10px",
};

type StepState = "active" | "idle" | "done";

function StepIndicator({
  num,
  label,
  state,
}: {
  num: number;
  label: string;
  state: StepState;
}) {
  const circleStyle: React.CSSProperties = {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "var(--font-roboto-mono), 'Roboto Mono', monospace",
    fontSize: "13px",
    fontWeight: 600,
    ...(state === "active"
      ? { background: "var(--blue)", color: "#01111f" }
      : state === "done"
        ? {
            background: "var(--green-dim)",
            color: "var(--green)",
            border: "0.5px solid rgba(22,201,90,0.3)",
          }
        : {
            background: "var(--s2)",
            color: "var(--t3)",
            border: "0.5px solid var(--b2)",
          }),
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        flexShrink: 0,
      }}
    >
      <div style={circleStyle}>{num}</div>
      <span
        style={{
          ...sans,
          fontSize: "14px",
          fontWeight: 500,
          color:
            state === "active"
              ? "var(--t1)"
              : state === "done"
                ? "var(--green)"
                : "var(--t3)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function AnalysisUploadClient({ userId, initialMethod }: Props) {
  const [method, setMethod] = useState<"cfop" | "beginner">(initialMethod);
  const [scramble, setScramble] = useState("");
  const [tipsOpen, setTipsOpen] = useState(true);

  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: "24px" }}>
        <p
          style={{
            ...mono,
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--blue)",
            marginBottom: "6px",
          }}
        >
          AI Solve Analysis
        </p>
        <h1
          style={{
            ...sans,
            fontSize: "34px",
            fontWeight: 700,
            letterSpacing: "-0.8px",
            lineHeight: 1.1,
            color: "var(--t1)",
            marginBottom: "6px",
          }}
        >
          Analyse your solve
        </h1>
        <p
          style={{
            ...sans,
            fontSize: "16px",
            color: "var(--t2)",
            lineHeight: 1.5,
          }}
        >
          Upload a video and get phase timings, algorithm recognition, and
          look-ahead feedback.
        </p>
      </div>

      {/* Step indicators */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <StepIndicator num={1} label="Configure" state="active" />
        <div
          style={{
            flex: 1,
            height: "0.5px",
            background: "var(--b2)",
            margin: "0 10px",
          }}
        />
        <StepIndicator num={2} label="Upload" state="idle" />
        <div
          style={{
            flex: 1,
            height: "0.5px",
            background: "var(--b2)",
            margin: "0 10px",
          }}
        />
        <StepIndicator num={3} label="Results" state="idle" />
      </div>

      {/* Step 1 — Configure */}
      <div style={{ marginBottom: "28px" }}>
        <p style={sectionLabel}>Step 1 — Configure</p>
        <div
          style={{
            background: "var(--s1)",
            border: "0.5px solid var(--b2)",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Method selector */}
            <div>
              <p style={fieldLabel}>Solving method</p>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["cfop", "beginner"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={method === m ? "anl-meth-on" : "anl-meth-off"}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Scramble input */}
            <div>
              <p style={fieldLabel}>
                Scramble{" "}
                <span
                  style={{
                    fontWeight: 400,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (optional)
                </span>
              </p>
              <input
                type="text"
                value={scramble}
                onChange={(e) => setScramble(e.target.value)}
                placeholder="e.g. R U R' U' F2 D …"
                style={{
                  width: "100%",
                  background: "var(--s2)",
                  border: "0.5px solid var(--b2)",
                  borderRadius: "10px",
                  padding: "11px 16px",
                  ...mono,
                  fontSize: "14px",
                  color: "var(--t2)",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 150ms",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--blue)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--b2)";
                }}
              />
              <p
                style={{
                  ...sans,
                  fontSize: "13px",
                  color: "var(--t3)",
                  marginTop: "6px",
                }}
              >
                Providing a scramble improves phase detection accuracy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 — Upload video */}
      <div style={{ marginBottom: "28px" }}>
        <p style={sectionLabel}>Step 2 — Upload video</p>
        <VideoUploader userId={userId} method={method} scramble={scramble} />
      </div>

      {/* Filming tips */}
      <div>
        <p style={sectionLabel}>Filming tips</p>
        <button
          type="button"
          onClick={() => setTipsOpen((o) => !o)}
          className="anl-tips-toggle"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Info
              size={15}
              strokeWidth={1.6}
              aria-hidden="true"
              style={{ color: "var(--t3)", flexShrink: 0 }}
            />
            <span
              style={{
                ...sans,
                fontSize: "16px",
                fontWeight: 500,
                color: "var(--t2)",
              }}
            >
              How to film for best results
            </span>
          </div>
          <ChevronDown
            size={15}
            aria-hidden="true"
            style={{
              color: "var(--t3)",
              transform: tipsOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 150ms",
              flexShrink: 0,
            }}
          />
        </button>

        {tipsOpen && (
          <div style={{ marginTop: "10px" }}>
            {/* Camera Position Guide Card */}
            <div
              style={{
                background: "#12141f",
                border: "0.5px solid #2d3148",
                borderRadius: "10px",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "0.5px solid #2d3148",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "5px",
                    }}
                  >
                    <p
                      style={{
                        ...mono,
                        fontSize: "12px",
                        fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "#60efb0",
                      }}
                    >
                      Camera Position Guide
                    </p>
                    <span
                      style={{
                        ...mono,
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "#60efb0",
                        background: "rgba(96,239,176,0.1)",
                        border: "0.5px solid rgba(96,239,176,0.3)",
                        borderRadius: "5px",
                        padding: "2px 7px",
                      }}
                    >
                      face-on
                    </span>
                  </div>
                  <p
                    style={{
                      ...sans,
                      fontSize: "13px",
                      color: "#6b7280",
                      lineHeight: 1.5,
                    }}
                  >
                    Keep the cube centered in the lower-middle of the frame,
                    with both hands fully visible.
                  </p>
                </div>
              </div>
              {/* Image area */}
              <div
                style={{
                  background: "#0d0f1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow:
                      "0 24px 64px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.06)",
                    display: "block",
                    maxWidth: "480px",
                    width: "100%",
                  }}
                >
                  {/* biome-ignore lint/performance/noImgElement: static illustration, no dynamic sizing needed */}
                  <img
                    src="/camera-position-face-on.png"
                    alt="Face-on camera position — keep the cube centered in the lower-middle of the frame"
                    style={{
                      width: "100%",
                      display: "block",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Tip columns */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "10px",
              }}
            >
              {TIPS.map((group) => (
                <div
                  key={group.label}
                  style={{
                    background: "var(--s1)",
                    border: "0.5px solid var(--b2)",
                    borderRadius: "10px",
                    padding: "16px",
                  }}
                >
                  <p
                    style={{
                      ...mono,
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: group.color,
                      marginBottom: "14px",
                    }}
                  >
                    {group.label}
                  </p>
                  {group.angles && (
                    <div
                      style={{
                        marginBottom: "16px",
                        paddingBottom: "16px",
                        borderBottom: "0.5px solid var(--b2)",
                      }}
                    >
                      <p
                        style={{
                          ...sans,
                          fontSize: "15px",
                          color: "var(--t1)",
                          marginBottom: "12px",
                          lineHeight: 1.5,
                        }}
                      >
                        {group.angleNote}
                      </p>
                      <p
                        style={{
                          ...mono,
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: group.color,
                          marginBottom: "8px",
                        }}
                      >
                        Recommended angles
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {group.angles.map((angle) => (
                          <span
                            key={angle}
                            style={{
                              ...mono,
                              fontSize: "13px",
                              fontWeight: 600,
                              color: group.color,
                              background:
                                "color-mix(in oklch, var(--green) 12%, transparent)",
                              border: `0.5px solid color-mix(in oklch, var(--green) 35%, transparent)`,
                              borderRadius: "5px",
                              padding: "4px 10px",
                            }}
                          >
                            {angle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {group.items.map((tip) => (
                    <div
                      key={tip}
                      style={{
                        display: "flex",
                        gap: "9px",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: group.color,
                          flexShrink: 0,
                          marginTop: "9px",
                        }}
                      />
                      <span
                        style={{
                          ...sans,
                          fontSize: "15px",
                          color: "var(--t2)",
                          lineHeight: 1.6,
                        }}
                      >
                        {tip}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
