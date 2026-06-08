"use client";

import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { VideoUploader } from "~/components/analysis/VideoUploader";

interface Props {
  userId: string;
  initialMethod: "cfop" | "beginner";
  usedThisMonth: number;
  usageLimit: number;
}

const TIPS = [
  {
    label: "Best setup",
    color: "var(--green)",
    items: [
      "Mount your phone directly above the cube (top-down, 30–50 cm away) so the full cube face and both hands are always visible.",
      "Use a plain, contrasting surface — white or dark mat works best against the stickers.",
      "Film in good, even lighting with no harsh shadows across the cube face.",
      "Keep the camera completely still — tape it to a shelf, use a phone stand, or rest it on a stack of books.",
    ],
  },
  {
    label: "Alternatives",
    color: "var(--yellow)",
    items: [
      "Film from a 45° angle slightly above eye level. Make sure all layers are partially visible.",
      "Film from the front at eye level — the AI can still detect move execution, though it may miss top-layer details.",
      "Avoid filming from below or the side — sticker colours become ambiguous and phase detection degrades.",
    ],
  },
  {
    label: "Avoid",
    color: "var(--red)",
    items: [
      "Don't cover the cube with your palms mid-solve — rotate with fingers on the sides.",
      "Don't film in direct sunlight — reflections on stickers confuse colour detection.",
      "Don't cut off your hands at the edges — the full hand movement needs to be visible for fingertrick analysis.",
    ],
  },
];

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "2.5px",
  textTransform: "uppercase",
  color: "var(--t3)",
  marginBottom: "14px",
};

const fieldLabel: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
  fontSize: "10px",
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
    fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
    fontSize: "11px",
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
          fontSize: "12px",
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

export function AnalysisUploadClient({
  userId,
  initialMethod,
  usedThisMonth,
  usageLimit,
}: Props) {
  const [method, setMethod] = useState<"cfop" | "beginner">(initialMethod);
  const [scramble, setScramble] = useState("");
  const [tipsOpen, setTipsOpen] = useState(true);

  const canUpload = usedThisMonth < usageLimit;

  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: "24px" }}>
        <p
          style={{
            ...mono,
            fontSize: "10px",
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
            fontSize: "28px",
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
            fontSize: "13.5px",
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
                  fontSize: "12px",
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
                  fontSize: "11px",
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
        <VideoUploader
          userId={userId}
          method={method}
          canUpload={canUpload}
          scramble={scramble}
        />
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
                fontSize: "13px",
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            {TIPS.map((group) => (
              <div
                key={group.label}
                style={{
                  background: "var(--s1)",
                  border: "0.5px solid var(--b2)",
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <p
                  style={{
                    ...mono,
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: group.color,
                    marginBottom: "10px",
                  }}
                >
                  {group.label}
                </p>
                {group.items.map((tip) => (
                  <div
                    key={tip}
                    style={{
                      display: "flex",
                      gap: "7px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: group.color,
                        flexShrink: 0,
                        marginTop: "6px",
                      }}
                    />
                    <span
                      style={{
                        ...sans,
                        fontSize: "12px",
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
        )}
      </div>
    </div>
  );
}
