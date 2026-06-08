"use client";

import { useEffect, useRef, useState } from "react";
import { UpsellModal } from "~/components/ui/UpsellModal";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface Props {
  analysisId: string;
  initialMessages: Message[];
  userTier: "free" | "premium" | "lifetime";
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export function ChatPanel({ analysisId, initialMessages }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<null | "limit" | "unavailable">(
    null,
  );
  const [showUpsell, setShowUpsell] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages and loading are scroll triggers
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    setErrorKind(null);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`/api/analysis/${analysisId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (res.status === 403) {
        const data = (await res.json()) as { error: string };
        setErrorKind(
          data.error === "chat_limit_reached" ? "limit" : "unavailable",
        );
        return;
      }

      if (!res.ok) {
        setErrorKind("unavailable");
        return;
      }

      const data = (await res.json()) as { reply: string };
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply },
      ]);
    } catch {
      setErrorKind("unavailable");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => {
          setExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="anl-coach-btn"
      >
        {/* Chat bubble icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          style={{ color: "var(--purple)", flexShrink: 0 }}
        >
          <path
            d="M1 1h12v9H8l-1.5 2L5 10H1V1z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
        Chat with your AI coach
      </button>
    );
  }

  return (
    <div
      style={{
        border: "0.5px solid var(--b2)",
        borderRadius: "14px",
        background: "var(--s1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "420px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "0.5px solid var(--b1)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7 1v2M7 11v2M1 7h2M11 7h2M3.05 3.05l1.42 1.42M9.53 9.53l1.42 1.42M3.05 10.95l1.42-1.42M9.53 4.47l1.42-1.42"
              stroke="var(--purple)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              ...mono,
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "var(--t2)",
            }}
          >
            AI Coach
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="anl-chat-close"
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      {/* Message list */}
      <div
        className="anl-chat-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.length === 0 && !loading && errorKind === null ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <p
              style={{
                ...sans,
                fontSize: "13px",
                color: "var(--t3)",
                textAlign: "center",
              }}
            >
              Ask anything about your solve.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={
                msg.role === "user"
                  ? {
                      alignSelf: "flex-end",
                      background: "var(--blue-dim)",
                      border: "0.5px solid var(--b2)",
                      borderRadius: "12px 12px 3px 12px",
                      padding: "10px 14px",
                      maxWidth: "75%",
                      ...sans,
                      fontSize: "13px",
                      color: "var(--t1)",
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                    }
                  : {
                      alignSelf: "flex-start",
                      background: "var(--s2)",
                      border: "0.5px solid var(--b1)",
                      borderRadius: "12px 12px 12px 3px",
                      padding: "10px 14px",
                      maxWidth: "85%",
                      ...sans,
                      fontSize: "13px",
                      color: "var(--t2)",
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap",
                    }
              }
            >
              {msg.content}
            </div>
          ))
        )}

        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "var(--s2)",
              border: "0.5px solid var(--b1)",
              borderRadius: "12px 12px 12px 3px",
              padding: "12px 14px",
              display: "flex",
              gap: "5px",
              alignItems: "center",
            }}
          >
            <div className="anl-blink-dot" />
            <div
              className="anl-blink-dot"
              style={{ animationDelay: "0.15s" }}
            />
            <div className="anl-blink-dot" style={{ animationDelay: "0.3s" }} />
          </div>
        )}

        {errorKind === "limit" && (
          <div style={{ textAlign: "center", padding: "16px" }}>
            {showUpsell && (
              <UpsellModal
                feature="chat"
                onClose={() => setShowUpsell(false)}
              />
            )}
            <p
              style={{
                ...sans,
                fontSize: "12px",
                color: "var(--t3)",
                marginBottom: "10px",
              }}
            >
              You&apos;ve reached the free chat limit for this analysis.
            </p>
            <button
              type="button"
              onClick={() => setShowUpsell(true)}
              className="cb-primary-btn"
            >
              Upgrade →
            </button>
          </div>
        )}

        {errorKind === "unavailable" && (
          <div style={{ textAlign: "center", padding: "16px" }}>
            <p style={{ ...sans, fontSize: "12px", color: "var(--red)" }}>
              Coach is unavailable right now — try again in a moment.
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "0.5px solid var(--b1)",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your solve…"
          disabled={loading || errorKind === "limit"}
          className="anl-chat-input"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!input.trim() || loading}
          className="anl-send-btn"
          aria-label="Send message"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 7h12M7 1l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
