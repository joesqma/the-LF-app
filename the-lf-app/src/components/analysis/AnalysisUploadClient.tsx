"use client";

import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { VideoUploader } from "~/components/analysis/VideoUploader";

interface Props {
  userId: string;
  initialMethod: "cfop" | "roux";
  usedThisMonth: number;
  usageLimit: number;
}

const TIPS = [
  {
    label: "Best setup",
    items: [
      "Mount your phone directly above the cube (top-down, 30–50 cm away) so the full cube face and both hands are always visible.",
      "Use a plain, contrasting surface — white or dark mat works best against the stickers.",
      "Film in good, even lighting with no harsh shadows across the cube face.",
      "Keep the camera completely still — tape it to a shelf, use a phone stand, or rest it on a stack of books.",
    ],
  },
  {
    label: "If top-down isn't possible",
    items: [
      "Film from a 45° angle slightly above eye level. Make sure all layers are partially visible.",
      "Film from the front at eye level — the AI can still detect move execution, though it may miss top-layer details.",
      "Avoid filming from below or the side — sticker colours become ambiguous and phase detection degrades.",
    ],
  },
  {
    label: "What to avoid",
    items: [
      "Don't cover the cube with your palms mid-solve — rotate with fingers on the sides.",
      "Don't film in direct sunlight — reflections on stickers confuse colour detection.",
      "Don't cut off your hands at the edges — the full hand movement needs to be visible for fingertrick analysis.",
    ],
  },
];

export function AnalysisUploadClient({
  userId,
  initialMethod,
  usedThisMonth,
  usageLimit,
}: Props) {
  const [method, setMethod] = useState<"cfop" | "roux">(initialMethod);
  const [tipsOpen, setTipsOpen] = useState(true);

  const canUpload = usedThisMonth < usageLimit;

  return (
    <div>
      {/* Method selector */}
      <div style={{ marginBottom: "24px" }}>
        <p
          className="font-dm-sans"
          style={{
            fontSize: "11px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-dimmer)",
            marginBottom: "10px",
          }}
        >
          Solving method
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["cfop", "roux"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={[
                "anl-method-pill font-dm-sans",
                method === m ? "anl-method-pill-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Video uploader */}
      <VideoUploader userId={userId} method={method} canUpload={canUpload} />

      {/* Divider */}
      <div
        style={{ height: "1px", background: "var(--border)", margin: "28px 0" }}
      />

      {/* Tips accordion */}
      <div>
        <button
          type="button"
          onClick={() => setTipsOpen((o) => !o)}
          className="anl-tips-btn"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Info
              size={14}
              style={{ color: "var(--text-dim)", flexShrink: 0 }}
            />
            <span
              className="font-dm-sans"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-muted)",
              }}
            >
              How to film for best results
            </span>
          </div>
          <ChevronDown
            size={16}
            style={{
              color: "var(--text-dim)",
              transform: tipsOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              flexShrink: 0,
            }}
          />
        </button>

        {tipsOpen && (
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {TIPS.map((section) => (
              <div key={section.label}>
                <p
                  className="font-dm-sans"
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--text-dimmer)",
                    marginBottom: "8px",
                  }}
                >
                  {section.label}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {section.items.map((tip) => (
                    <li
                      key={tip}
                      style={{
                        paddingLeft: "14px",
                        position: "relative",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "var(--text-dimmer)",
                        }}
                      >
                        ·
                      </span>
                      <span
                        className="font-dm-sans"
                        style={{
                          fontSize: "12px",
                          fontWeight: 300,
                          color: "var(--text-dim)",
                          lineHeight: 1.6,
                        }}
                      >
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
