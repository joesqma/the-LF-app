"use client";

import { useRouter } from "next/navigation";

export type UpsellFeature = "analysis" | "chat" | "bookmark";

interface Props {
  feature: UpsellFeature;
  onClose: () => void;
}

const COPY: Record<UpsellFeature, { title: string; description: string }> = {
  analysis: {
    title: "Monthly limit reached",
    description:
      "Free accounts get 3 analyses per month. Upgrade to Premium for unlimited AI solve analysis.",
  },
  chat: {
    title: "Chat limit reached",
    description:
      "Free accounts get 10 messages per analysis. Upgrade to Premium for unlimited coaching.",
  },
  bookmark: {
    title: "Bookmark limit reached",
    description:
      "Free accounts can save up to 20 lessons. Upgrade to Premium for unlimited bookmarks.",
  },
};

export function UpsellModal({ feature, onClose }: Props) {
  const router = useRouter();
  const { title, description } = COPY[feature];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Panel */}
      <div
        role="document"
        style={{
          position: "relative",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <h2
          className="font-syne"
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            marginBottom: "10px",
          }}
        >
          {title}
        </h2>
        <p
          className="font-dm-sans"
          style={{
            fontSize: "14px",
            fontWeight: 300,
            color: "var(--text-muted)",
            lineHeight: 1.6,
            marginBottom: "28px",
          }}
        >
          {description}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={() => {
              router.push("/settings#upgrade");
              onClose();
            }}
            className="font-dm-sans"
            style={{
              background: "var(--accent-blue)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "11px 20px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Upgrade to Premium
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-dm-sans"
            style={{
              background: "transparent",
              color: "var(--text-dimmer)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "11px 20px",
              fontSize: "14px",
              fontWeight: 400,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
