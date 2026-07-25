"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Clock3,
  Copy,
  Download,
  FileSearch,
  Layers3,
  Play,
  Plus,
  ScanSearch,
  Shuffle,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { deleteAnalysis } from "~/lib/actions/analysis";
import { removeBookmark } from "~/lib/actions/bookmarks";
import { deleteSavedScramble } from "~/lib/actions/timer";
import type { AnalysisReport } from "~/types/analysis";

type TabId = "analyses" | "videos" | "scrambles";

interface AnalysisRow {
  id: string;
  method: "cfop" | "beginner" | null;
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
  puzzle: string;
  created_at: string;
}

interface Props {
  analyses: AnalysisRow[];
  bookmarks: BookmarkRow[];
  scrambles: ScrambleRow[];
}

const STATUS_LABEL: Record<AnalysisRow["status"], string> = {
  complete: "Complete",
  processing: "Analysing",
  failed: "Failed",
  pending: "Pending",
};

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getYtId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

function FilterButton({
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
      className={active ? "library-filter is-active" : "library-filter"}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function EmptyState({
  Icon,
  title,
  description,
  action,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="library-empty">
      <span className="library-empty__icon">
        <Icon size={22} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function LibraryClient({
  analyses: initialAnalyses,
  bookmarks: initialBookmarks,
  scrambles: initialScrambles,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("analyses");
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [scrambles, setScrambles] = useState(initialScrambles);
  const [analysisMethod, setAnalysisMethod] = useState("all");
  const [analysisStatus, setAnalysisStatus] = useState("all");
  const [videoFilter, setVideoFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingScrambleId, setPendingScrambleId] = useState<string | null>(
    null,
  );
  const [pendingAnalysisId, setPendingAnalysisId] = useState<string | null>(
    null,
  );
  const [pendingVideo, setPendingVideo] = useState<BookmarkRow | null>(null);
  const [busy, setBusy] = useState(false);

  const videoTags = useMemo(
    () =>
      [
        ...new Set(
          bookmarks.flatMap((bookmark) => [
            bookmark.method_tag,
            bookmark.topic_tag,
          ]),
        ),
      ].filter((tag): tag is string => Boolean(tag)),
    [bookmarks],
  );

  const analysisMethods = useMemo(
    () =>
      [
        ...new Set(analyses.map((analysis) => analysis.method).filter(Boolean)),
      ] as string[],
    [analyses],
  );

  const filteredAnalyses = useMemo(
    () =>
      analyses.filter((analysis) => {
        if (analysisMethod !== "all" && analysis.method !== analysisMethod)
          return false;
        if (analysisStatus === "complete")
          return analysis.status === "complete";
        if (analysisStatus === "processing") {
          return (
            analysis.status === "processing" || analysis.status === "pending"
          );
        }
        return true;
      }),
    [analyses, analysisMethod, analysisStatus],
  );

  const filteredBookmarks = useMemo(
    () =>
      bookmarks.filter((bookmark) =>
        videoFilter === "all"
          ? true
          : bookmark.topic_tag === videoFilter ||
            bookmark.method_tag === videoFilter,
      ),
    [bookmarks, videoFilter],
  );

  const tabs: Array<{
    id: TabId;
    label: string;
    count: number;
    Icon: LucideIcon;
  }> = [
    {
      id: "analyses",
      label: "Analyses",
      count: analyses.length,
      Icon: ScanSearch,
    },
    {
      id: "videos",
      label: "Saved videos",
      count: bookmarks.length,
      Icon: Bookmark,
    },
    {
      id: "scrambles",
      label: "Scrambles",
      count: scrambles.length,
      Icon: Shuffle,
    },
  ];

  async function confirmDeleteScramble() {
    if (!pendingScrambleId) return;
    setBusy(true);
    const previous = scrambles;
    setScrambles((items) =>
      items.filter((item) => item.id !== pendingScrambleId),
    );
    await deleteSavedScramble(pendingScrambleId).catch(() =>
      setScrambles(previous),
    );
    setPendingScrambleId(null);
    setBusy(false);
  }

  async function confirmDeleteAnalysis() {
    if (!pendingAnalysisId) return;
    setBusy(true);
    const previous = analyses;
    setAnalyses((items) =>
      items.filter((item) => item.id !== pendingAnalysisId),
    );
    const result = await deleteAnalysis(pendingAnalysisId);
    if ("error" in result) setAnalyses(previous);
    setPendingAnalysisId(null);
    setBusy(false);
  }

  async function confirmRemoveVideo() {
    if (!pendingVideo) return;
    setBusy(true);
    const previous = bookmarks;
    setBookmarks((items) =>
      items.filter((item) => item.id !== pendingVideo.id),
    );
    const result = await removeBookmark(pendingVideo.video_url);
    if ("error" in result) setBookmarks(previous);
    setPendingVideo(null);
    setBusy(false);
  }

  async function handleCopy(id: string, scramble: string) {
    await navigator.clipboard.writeText(scramble);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1500);
  }

  function handleExport() {
    const blob = new Blob([scrambles.map((item) => item.scramble).join("\n")], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cubewise-scrambles.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="library-workspace">
      <div
        className="library-tabs"
        role="tablist"
        aria-label="Library collections"
      >
        {tabs.map(({ id, label, count, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={
              activeTab === id ? "library-tab is-active" : "library-tab"
            }
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
            <strong>{count}</strong>
          </button>
        ))}
      </div>

      <div className="library-panel" key={activeTab}>
        {activeTab === "analyses" && (
          <>
            <div className="library-toolbar">
              <div className="library-toolbar__title">
                <span className="library-eyebrow">Solve reviews</span>
                <h2>Past analyses</h2>
              </div>
              <Link href="/analysis" className="library-primary-action">
                <Plus size={16} /> New analysis
              </Link>
            </div>

            {analyses.length > 0 && (
              <div className="library-filter-row">
                <FilterButton
                  active={analysisMethod === "all"}
                  label="All methods"
                  onClick={() => setAnalysisMethod("all")}
                />
                {analysisMethods.map((method) => (
                  <FilterButton
                    key={method}
                    active={analysisMethod === method}
                    label={method.toUpperCase()}
                    onClick={() => setAnalysisMethod(method)}
                  />
                ))}
                <span className="library-filter-divider" />
                <FilterButton
                  active={analysisStatus === "complete"}
                  label="Complete"
                  onClick={() =>
                    setAnalysisStatus(
                      analysisStatus === "complete" ? "all" : "complete",
                    )
                  }
                />
                <FilterButton
                  active={analysisStatus === "processing"}
                  label="In progress"
                  onClick={() =>
                    setAnalysisStatus(
                      analysisStatus === "processing" ? "all" : "processing",
                    )
                  }
                />
              </div>
            )}

            {analyses.length === 0 ? (
              <EmptyState
                Icon={FileSearch}
                title="No analyses saved yet"
                description="Your completed solve reviews will collect here."
                action={
                  <Link href="/analysis" className="library-empty__action">
                    Upload a solve <ArrowUpRight size={14} />
                  </Link>
                }
              />
            ) : filteredAnalyses.length === 0 ? (
              <EmptyState
                Icon={FileSearch}
                title="No matching analyses"
                description="Try a different method or status filter."
              />
            ) : (
              <div className="analysis-collection">
                {filteredAnalyses.map((analysis) => {
                  const report = analysis.report as AnalysisReport | null;
                  const priority = report?.top_priorities?.[0];
                  return (
                    <article
                      key={analysis.id}
                      className="analysis-library-card"
                      data-status={analysis.status}
                    >
                      <div className="analysis-library-card__top">
                        <span className="analysis-library-card__status">
                          <i /> {STATUS_LABEL[analysis.status]}
                        </span>
                        <button
                          type="button"
                          className="library-icon-button"
                          aria-label="Delete analysis"
                          onClick={() => setPendingAnalysisId(analysis.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="analysis-library-card__main">
                        <span className="analysis-library-card__method">
                          {analysis.method?.toUpperCase() ?? "CFOP"}
                        </span>
                        <h3>{report?.overall_summary ?? "Solve analysis"}</h3>
                        <p>
                          {priority
                            ? `Focus next: ${priority}`
                            : "Open the report to review your solve feedback."}
                        </p>
                      </div>
                      <div className="analysis-library-card__meta">
                        <span>
                          <Clock3 size={14} />{" "}
                          {report?.estimated_total_time
                            ? `${report.estimated_total_time}s`
                            : "Time pending"}
                        </span>
                        <span>
                          <Layers3 size={14} /> {report?.phases?.length ?? 0}{" "}
                          phases
                        </span>
                        <span>{fmtDate(analysis.created_at)}</span>
                      </div>
                      <Link
                        href={`/analysis/${analysis.id}`}
                        className="analysis-library-card__link"
                      >
                        View report <ArrowUpRight size={15} />
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "videos" && (
          <>
            <div className="library-toolbar">
              <div className="library-toolbar__title">
                <span className="library-eyebrow">Watch later</span>
                <h2>Saved videos</h2>
              </div>
              <Link href="/learn" className="library-secondary-action">
                Browse lessons <ArrowUpRight size={15} />
              </Link>
            </div>

            {bookmarks.length > 0 && (
              <div className="library-filter-row">
                <FilterButton
                  active={videoFilter === "all"}
                  label="All videos"
                  onClick={() => setVideoFilter("all")}
                />
                {videoTags.map((tag) => (
                  <FilterButton
                    key={tag}
                    active={videoFilter === tag}
                    label={tag}
                    onClick={() => setVideoFilter(tag)}
                  />
                ))}
              </div>
            )}

            {bookmarks.length === 0 ? (
              <EmptyState
                Icon={Bookmark}
                title="No saved videos"
                description="Bookmark a lesson video and it will appear here."
              />
            ) : filteredBookmarks.length === 0 ? (
              <EmptyState
                Icon={Bookmark}
                title="No matching videos"
                description="Choose another topic to see more of your collection."
              />
            ) : (
              <div className="video-collection">
                {filteredBookmarks.map((bookmark) => {
                  const ytId = getYtId(bookmark.video_url);
                  return (
                    <article key={bookmark.id} className="video-library-card">
                      <a
                        href={bookmark.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="video-library-card__media"
                      >
                        {ytId ? (
                          <Image
                            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                            alt=""
                            fill
                            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 360px"
                          />
                        ) : (
                          <span className="video-library-card__fallback">
                            <Play size={24} />
                          </span>
                        )}
                        <span className="video-library-card__play">
                          <Play size={17} fill="currentColor" />
                        </span>
                      </a>
                      <button
                        type="button"
                        className="video-library-card__remove"
                        aria-label="Remove saved video"
                        onClick={() => setPendingVideo(bookmark)}
                      >
                        <Trash2 size={15} />
                      </button>
                      <div className="video-library-card__body">
                        <div className="video-library-card__tags">
                          {bookmark.source && <span>{bookmark.source}</span>}
                          {bookmark.method_tag && (
                            <span>{bookmark.method_tag}</span>
                          )}
                          {bookmark.topic_tag && (
                            <span>{bookmark.topic_tag}</span>
                          )}
                        </div>
                        <h3>{bookmark.title}</h3>
                        <a
                          href={bookmark.video_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Watch video <ArrowUpRight size={14} />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "scrambles" && (
          <>
            <div className="library-toolbar">
              <div className="library-toolbar__title">
                <span className="library-eyebrow">Practice queue</span>
                <h2>Saved scrambles</h2>
              </div>
              {scrambles.length > 0 && (
                <button
                  type="button"
                  className="library-secondary-action"
                  onClick={handleExport}
                >
                  <Download size={15} /> Export all
                </button>
              )}
            </div>

            {scrambles.length === 0 ? (
              <EmptyState
                Icon={Shuffle}
                title="No saved scrambles"
                description="Save a useful scramble from the timer to build your practice queue."
              />
            ) : (
              <div className="scramble-collection">
                {scrambles.map((scramble, index) => (
                  <article key={scramble.id} className="scramble-library-row">
                    <span className="scramble-library-row__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="scramble-library-row__content">
                      <code>{scramble.scramble}</code>
                      <div>
                        <span>{scramble.puzzle}</span>
                        <time>{fmtDate(scramble.created_at)}</time>
                      </div>
                    </div>
                    <div className="scramble-library-row__actions">
                      <button
                        type="button"
                        className="library-icon-button"
                        aria-label={
                          copiedId === scramble.id ? "Copied" : "Copy scramble"
                        }
                        onClick={() =>
                          handleCopy(scramble.id, scramble.scramble)
                        }
                      >
                        {copiedId === scramble.id ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        className="library-icon-button"
                        aria-label="Remove scramble"
                        onClick={() => setPendingScrambleId(scramble.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingScrambleId)}
        title="Remove scramble?"
        description="This scramble will be removed from your library."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        disabled={busy}
        onConfirm={confirmDeleteScramble}
        onCancel={() => setPendingScrambleId(null)}
      />
      <ConfirmDialog
        open={Boolean(pendingAnalysisId)}
        title="Delete analysis?"
        description="This analysis, its report, and the uploaded video will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        disabled={busy}
        onConfirm={confirmDeleteAnalysis}
        onCancel={() => setPendingAnalysisId(null)}
      />
      <ConfirmDialog
        open={Boolean(pendingVideo)}
        title="Remove saved video?"
        description="This video will be removed from your library."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        disabled={busy}
        onConfirm={confirmRemoveVideo}
        onCancel={() => setPendingVideo(null)}
      />
    </section>
  );
}
