"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeBookmark } from "~/lib/actions/bookmarks";
import type { AnalysisReport } from "~/types/analysis";

// ── Types ──────────────────────────────────────────────────────────────────────

type TabId = "analyses" | "videos" | "scrambles";

interface AnalysisRow {
  id: string;
  method: "cfop" | "roux" | null;
  status: "pending" | "processing" | "complete" | "failed";
  report: unknown;
  created_at: string;
}

interface BookmarkRow {
  id: string;
  video_url: string;
  title: string;
  source: string | null;
  topic_tag: string | null;
  method_tag: string | null;
}

interface ScrambleRow {
  id: string;
  scramble: string;
  created_at: string;
  session_id: string;
}

interface Props {
  analyses: AnalysisRow[];
  bookmarks: BookmarkRow[];
  scrambles: ScrambleRow[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getYtId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1] ?? null;
}

const STATUS_COLOR: Record<string, string> = {
  complete: "#22c55e",
  processing: "#f59e0b",
  failed: "#ef4444",
  pending: "#555",
};

const STATUS_LABEL: Record<string, string> = {
  complete: "Complete",
  processing: "Analysing",
  failed: "Failed",
  pending: "Pending",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lib-filter-pill font-dm-sans"
      data-active={active}
      style={{
        fontSize: "12px",
        fontWeight: 400,
        padding: "5px 12px",
        borderRadius: "20px",
        border: `1px solid ${active ? "#1d3557" : "var(--border)"}`,
        background: active ? "#0d1f35" : "transparent",
        color: active ? "var(--accent-blue)" : "var(--text-dim)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-dm-sans"
      style={{
        fontSize: "11px",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-dimmer)",
      }}
    >
      {children}
    </span>
  );
}

function EmptyDashed({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        border: "1px dashed #1d1d1d",
        borderRadius: "12px",
        padding: "48px 20px",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{ fontSize: "28px", opacity: 0.3, marginBottom: "14px" }}
      >
        {icon}
      </div>
      <p
        className="font-dm-sans"
        style={{ fontSize: "14px", fontWeight: 500, color: "#2a2a2a" }}
      >
        {title}
      </p>
      <p
        className="font-dm-sans"
        style={{
          fontSize: "13px",
          fontWeight: 300,
          color: "#222",
          marginTop: "6px",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function LibraryClient({
  analyses,
  bookmarks: initialBookmarks,
  scrambles,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("analyses");
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [aMethodF, setAMethodF] = useState("all");
  const [aStatusF, setAStatusF] = useState("all");
  const [vFilter, setVFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const videoTags = [
    ...new Set(
      initialBookmarks
        .flatMap((b) => [b.method_tag, b.topic_tag])
        .filter((t): t is string => t !== null && t !== ""),
    ),
  ];

  const filteredAnalyses = analyses.filter((a) => {
    if (aMethodF !== "all" && a.method !== aMethodF) return false;
    if (aStatusF === "complete" && a.status !== "complete") return false;
    if (
      aStatusF === "processing" &&
      a.status !== "processing" &&
      a.status !== "pending"
    )
      return false;
    return true;
  });

  const filteredBookmarks = bookmarks.filter((b) => {
    if (vFilter === "all") return true;
    return b.topic_tag === vFilter || b.method_tag === vFilter;
  });

  async function handleRemove(id: string, videoUrl: string) {
    if (!confirm("Remove this video from your library?")) return;
    const prev = bookmarks;
    setBookmarks((bs) => bs.filter((b) => b.id !== id));
    const res = await removeBookmark(videoUrl);
    if ("error" in res) setBookmarks(prev);
  }

  async function handleCopy(id: string, scramble: string) {
    await navigator.clipboard.writeText(scramble);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleExport() {
    const text = scrambles.map((s) => s.scramble).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scrambles.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "analyses", label: "Analyses", count: analyses.length },
    { id: "videos", label: "Videos", count: bookmarks.length },
    { id: "scrambles", label: "Scrambles", count: scrambles.length },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          padding: "0 48px",
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="font-dm-sans"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "10px 16px 11px",
              fontSize: "13px",
              fontWeight: 500,
              color:
                activeTab === tab.id
                  ? "var(--text-primary)"
                  : "var(--text-dim)",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderBottom: `2px solid ${activeTab === tab.id ? "var(--accent-blue)" : "transparent"}`,
              marginBottom: "-1px",
              transition: "color 0.15s",
            }}
          >
            {tab.label}
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: "20px",
                background: activeTab === tab.id ? "#0d1f35" : "#1a1a1a",
                color:
                  activeTab === tab.id
                    ? "var(--accent-blue)"
                    : "var(--text-dimmer)",
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        key={activeTab}
        className="lib-scroll lib-fade-up"
        style={{ flex: 1, overflowY: "auto", padding: "32px 56px" }}
      >
        {/* ── ANALYSES TAB ── */}
        {activeTab === "analyses" && (
          <>
            {/* Section header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <SectionLabel>
                {analyses.length}{" "}
                {analyses.length === 1 ? "analysis" : "analyses"}
              </SectionLabel>
              <Link
                href="/analysis"
                className="lib-ghost-action font-dm-sans"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "var(--text-dim)",
                  textDecoration: "none",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 1v10M1 6h10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                New analysis
              </Link>
            </div>

            {/* Filter row */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "16px",
                alignItems: "center",
              }}
            >
              {(["all", "cfop", "roux"] as const).map((f) => (
                <FilterPill
                  key={f}
                  active={aMethodF === f}
                  label={f === "all" ? "All" : f.toUpperCase()}
                  onClick={() => setAMethodF(f)}
                />
              ))}
              <div
                aria-hidden="true"
                style={{
                  width: "1px",
                  height: "16px",
                  background: "var(--border)",
                  margin: "0 4px",
                }}
              />
              {(["complete", "processing"] as const).map((f) => (
                <FilterPill
                  key={f}
                  active={aStatusF === f}
                  label={f.charAt(0).toUpperCase() + f.slice(1)}
                  onClick={() => setAStatusF(aStatusF === f ? "all" : f)}
                />
              ))}
            </div>

            {/* Cards */}
            {filteredAnalyses.length === 0 ? (
              analyses.length === 0 ? (
                <div
                  style={{
                    border: "1px dashed #1d1d1d",
                    borderRadius: "12px",
                    padding: "48px 20px",
                    textAlign: "center",
                  }}
                >
                  <p
                    className="font-dm-sans"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#2a2a2a",
                    }}
                  >
                    No analyses yet.
                  </p>
                  <p
                    className="font-dm-sans"
                    style={{
                      fontSize: "13px",
                      fontWeight: 300,
                      color: "#222",
                      marginTop: "6px",
                    }}
                  >
                    <Link href="/analysis" style={{ color: "var(--text-dim)" }}>
                      Upload a solve video
                    </Link>{" "}
                    to get started.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed #1d1d1d",
                    borderRadius: "12px",
                    padding: "32px 20px",
                    textAlign: "center",
                  }}
                >
                  <p
                    className="font-dm-sans"
                    style={{ fontSize: "13px", color: "#2a2a2a" }}
                  >
                    No analyses match your filters.
                  </p>
                </div>
              )
            ) : (
              filteredAnalyses.map((analysis) => {
                const report = analysis.report as AnalysisReport | null;
                const topPriority = report?.top_priorities?.[0] ?? null;
                const phases = report?.phases?.slice(0, 3) ?? [];
                const phaseCount = report?.phases?.length ?? 0;
                const estimatedTime = report?.estimated_total_time ?? null;

                return (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: card click is supplemental; keyboard users can use the View report button
                  // biome-ignore lint/a11y/noStaticElementInteractions: intentional card-level click shortcut
                  <div
                    key={analysis.id}
                    className="lib-analysis-card"
                    onClick={() => router.push(`/analysis/${analysis.id}`)}
                    style={{
                      borderRadius: "12px",
                      marginBottom: "8px",
                      cursor: "pointer",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "stretch",
                    }}
                  >
                    {/* Left accent bar */}
                    <div
                      aria-hidden="true"
                      style={{
                        width: "3px",
                        flexShrink: 0,
                        borderRadius: "12px 0 0 12px",
                        background: STATUS_COLOR[analysis.status] ?? "#555",
                      }}
                    />
                    {/* Card body */}
                    <div
                      style={{
                        flex: 1,
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                      }}
                    >
                      {/* Left section */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Method badge + status badge */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "5px",
                          }}
                        >
                          <span
                            className="font-dm-sans"
                            style={{
                              fontSize: "10px",
                              fontWeight: 500,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              padding: "2px 8px",
                              borderRadius: "5px",
                              background: "#0d1a2e",
                              color: "var(--accent-blue)",
                              border: "1px solid #1d3557",
                            }}
                          >
                            {analysis.method?.toUpperCase() ?? "CFOP"}
                          </span>
                          <span
                            className="font-dm-sans"
                            style={{
                              fontSize: "10px",
                              color: STATUS_COLOR[analysis.status],
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                width: "5px",
                                height: "5px",
                                borderRadius: "50%",
                                background: "currentColor",
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                            />
                            {STATUS_LABEL[analysis.status]}
                          </span>
                        </div>

                        {/* Priority line */}
                        {topPriority && (
                          <p
                            className="font-dm-sans"
                            style={{
                              fontSize: "13px",
                              fontWeight: 400,
                              color: "var(--text-secondary)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              marginBottom: "4px",
                            }}
                          >
                            Top priority: {topPriority}
                          </p>
                        )}

                        {/* Meta row */}
                        <div
                          className="font-dm-sans"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "11px",
                            fontWeight: 300,
                            color: "var(--text-dimmer)",
                          }}
                        >
                          <span>{fmtDate(analysis.created_at)}</span>
                          {estimatedTime && (
                            <>
                              <span
                                aria-hidden="true"
                                style={{ color: "#2a2a2a" }}
                              >
                                ·
                              </span>
                              <span>{estimatedTime} estimated</span>
                            </>
                          )}
                          {phaseCount > 0 && (
                            <>
                              <span
                                aria-hidden="true"
                                style={{ color: "#2a2a2a" }}
                              >
                                ·
                              </span>
                              <span>{phaseCount} phases analysed</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Phase chips */}
                      {phases.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexShrink: 0,
                          }}
                        >
                          {phases.map((phase) => {
                            const flagged = !!phase.recommendation;
                            return (
                              <span
                                key={phase.name}
                                className="font-dm-sans"
                                style={{
                                  fontSize: "10px",
                                  padding: "3px 8px",
                                  borderRadius: "5px",
                                  border: `1px solid ${flagged ? "#3a2800" : "var(--border)"}`,
                                  background: flagged
                                    ? "#1a1200"
                                    : "transparent",
                                  color: flagged
                                    ? "#a06010"
                                    : "var(--text-dimmer)",
                                }}
                              >
                                {phase.name}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* View report button */}
                      <button
                        type="button"
                        className="lib-view-btn font-dm-sans"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/analysis/${analysis.id}`);
                        }}
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "var(--text-dim)",
                          background: "transparent",
                          border: "1px solid var(--border)",
                          borderRadius: "7px",
                          padding: "7px 14px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        View report
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── VIDEOS TAB ── */}
        {activeTab === "videos" && (
          <>
            {/* Section header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <SectionLabel>
                {bookmarks.length} saved{" "}
                {bookmarks.length === 1 ? "video" : "videos"}
              </SectionLabel>
              {videoTags.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                  }}
                >
                  <FilterPill
                    active={vFilter === "all"}
                    label="All"
                    onClick={() => setVFilter("all")}
                  />
                  {videoTags.map((tag) => (
                    <FilterPill
                      key={tag}
                      active={vFilter === tag}
                      label={tag}
                      onClick={() => setVFilter(vFilter === tag ? "all" : tag)}
                    />
                  ))}
                </div>
              )}
            </div>

            {bookmarks.length === 0 ? (
              <EmptyDashed
                icon="🔖"
                title="No saved videos yet."
                subtitle="Bookmark videos from your lessons to find them here."
              />
            ) : filteredBookmarks.length === 0 ? (
              <div
                style={{
                  border: "1px dashed #1d1d1d",
                  borderRadius: "12px",
                  padding: "32px 20px",
                  textAlign: "center",
                }}
              >
                <p
                  className="font-dm-sans"
                  style={{ fontSize: "13px", color: "#2a2a2a" }}
                >
                  No videos match the selected filter.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                }}
              >
                {filteredBookmarks.map((bookmark) => {
                  const ytId = getYtId(bookmark.video_url);
                  return (
                    <button
                      key={bookmark.id}
                      type="button"
                      className="lib-video-card"
                      onClick={() => window.open(bookmark.video_url, "_blank")}
                      style={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        cursor: "pointer",
                        position: "relative",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "16/9",
                          position: "relative",
                          overflow: "hidden",
                          background: "#111",
                        }}
                      >
                        {ytId && (
                          <Image
                            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                            alt={bookmark.title}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="(max-width: 1200px) 33vw, 400px"
                          />
                        )}
                        {/* Play overlay */}
                        <div
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "rgba(255,255,255,0.1)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M3 2l7 4-7 4V2z"
                                fill="rgba(255,255,255,0.7)"
                              />
                            </svg>
                          </div>
                        </div>
                        {/* Source label */}
                        {bookmark.source && (
                          <span
                            className="font-dm-sans"
                            style={{
                              position: "absolute",
                              bottom: "8px",
                              left: "8px",
                              fontSize: "10px",
                              color: "rgba(255,255,255,0.4)",
                              background: "rgba(0,0,0,0.5)",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              zIndex: 1,
                            }}
                          >
                            {bookmark.source}
                          </span>
                        )}
                        {/* Remove bookmark button */}
                        <button
                          type="button"
                          className="lib-bookmark-btn"
                          aria-label="Remove from library"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(bookmark.id, bookmark.video_url);
                          }}
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            background: "rgba(0,0,0,0.65)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 2,
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M2 3h8M4.5 1.5h3M5 5v4M7 5v4M3 3l.75 6h4.5L9 3"
                              stroke="rgba(255,255,255,0.45)"
                              strokeWidth="1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Info area */}
                      <div style={{ padding: "12px 14px 14px" }}>
                        <p
                          className="font-dm-sans"
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "var(--text-secondary)",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            marginBottom: "6px",
                          }}
                        >
                          {bookmark.title}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            flexWrap: "wrap",
                          }}
                        >
                          {bookmark.method_tag && (
                            <span
                              className="font-dm-sans"
                              style={{
                                fontSize: "10px",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                border: "1px solid #1d3557",
                                color: "#3b6a9a",
                                background: "#0a1625",
                              }}
                            >
                              {bookmark.method_tag}
                            </span>
                          )}
                          {bookmark.topic_tag && (
                            <span
                              className="font-dm-sans"
                              style={{
                                fontSize: "10px",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                border: "1px solid var(--border)",
                                color: "#444",
                              }}
                            >
                              {bookmark.topic_tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── SCRAMBLES TAB ── */}
        {activeTab === "scrambles" && (
          <>
            {/* Section header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <SectionLabel>
                {scrambles.length}{" "}
                {scrambles.length === 1 ? "scramble" : "scrambles"}
              </SectionLabel>
              {scrambles.length > 0 && (
                <button
                  type="button"
                  className="lib-ghost-action font-dm-sans"
                  onClick={handleExport}
                  style={{
                    fontSize: "12px",
                    color: "var(--text-dim)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Export all
                </button>
              )}
            </div>

            {scrambles.length === 0 ? (
              <EmptyDashed
                icon="🔀"
                title="No scrambles saved."
                subtitle="Scrambles are saved automatically when you use the timer."
              />
            ) : (
              scrambles.map((s, idx) => (
                <div
                  key={s.id}
                  className="lib-scramble-card"
                  style={{
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  {/* Row number */}
                  <span
                    aria-hidden="true"
                    className="font-dm-sans"
                    style={{
                      fontSize: "11px",
                      color: "var(--text-dimmer)",
                      width: "20px",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>

                  {/* Scramble text */}
                  <span
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      letterSpacing: "0.04em",
                      lineHeight: 1.5,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.scramble}
                  </span>

                  {/* Right section */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="font-dm-sans"
                      style={{
                        fontSize: "10px",
                        padding: "3px 8px",
                        borderRadius: "5px",
                        border: "1px solid var(--border)",
                        color: "var(--text-dimmer)",
                      }}
                    >
                      3×3
                    </span>

                    <span
                      className="font-dm-sans"
                      style={{
                        fontSize: "11px",
                        color: "var(--text-dimmer)",
                      }}
                    >
                      {fmtDate(s.created_at)}
                    </span>

                    <button
                      type="button"
                      className="lib-copy-btn"
                      aria-label={
                        copiedId === s.id ? "Copied!" : "Copy scramble"
                      }
                      onClick={() => handleCopy(s.id, s.scramble)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        background: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {copiedId === s.id ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="#22c55e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden="true"
                        >
                          <rect
                            x="4"
                            y="4"
                            width="6"
                            height="7"
                            rx="1"
                            stroke="var(--text-dim)"
                            strokeWidth="1"
                          />
                          <path
                            d="M2 8V2h6"
                            stroke="var(--text-dim)"
                            strokeWidth="1"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
