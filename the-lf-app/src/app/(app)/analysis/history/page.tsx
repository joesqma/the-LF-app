import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import type { Analysis } from "~/types/database";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_COLOR: Record<Analysis["status"], string> = {
  complete: "var(--green)",
  processing: "var(--orange)",
  pending: "var(--t3)",
  failed: "var(--red)",
};

const STATUS_LABEL: Record<Analysis["status"], string> = {
  pending: "Queued",
  processing: "Analysing…",
  complete: "Complete",
  failed: "Failed",
};

const ACTION_LABEL: Record<Analysis["status"], string> = {
  pending: "Resume",
  processing: "View",
  complete: "View report",
  failed: "Retry",
};

const mono: React.CSSProperties = {
  fontFamily: "var(--font-roboto-mono), 'Roboto Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export default async function AnalysisHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, method, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ background: "var(--bg)", padding: "28px 32px 48px" }}>
      {/* Hero */}
      <div style={{ marginBottom: "28px" }}>
        <p
          style={{
            ...mono,
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "2px",
            color: "var(--t3)",
            marginBottom: "8px",
          }}
        >
          Analysis
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <h1
            style={{
              ...sans,
              fontSize: "38px",
              fontWeight: 700,
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
              color: "var(--t1)",
            }}
          >
            History
          </h1>
          <Link
            href="/analysis"
            style={{
              ...mono,
              fontSize: "11px",
              fontWeight: 400,
              color: "var(--t3)",
              textDecoration: "none",
            }}
          >
            ← New analysis
          </Link>
        </div>
      </div>

      {/* Content */}
      {!analyses || analyses.length === 0 ? (
        <div
          style={{
            background: "var(--s1)",
            border: "0.5px solid var(--b1)",
            borderRadius: "14px",
            padding: "48px 22px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              ...sans,
              fontSize: "13px",
              fontWeight: 400,
              color: "var(--t3)",
            }}
          >
            No analyses yet. Upload a solve video to get started.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--s1)",
            border: "0.5px solid var(--b2)",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto auto",
              gap: "16px",
              alignItems: "center",
              padding: "10px 22px",
              borderBottom: "0.5px solid var(--b1)",
            }}
          >
            {["Method", "Status", "Date", ""].map((label) => (
              <span
                key={label}
                style={{
                  ...mono,
                  fontSize: "9px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  color: "var(--t3)",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Rows */}
          {analyses.map((analysis, i) => {
            const isLast = i === analyses.length - 1;
            const dotColor = STATUS_COLOR[analysis.status];

            return (
              <div
                key={analysis.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: "16px",
                  alignItems: "center",
                  padding: "12px 22px",
                  borderBottom: isLast ? "none" : "0.5px solid var(--b1)",
                }}
              >
                {/* Method */}
                <span
                  style={{
                    ...mono,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--t1)",
                  }}
                >
                  {analysis.method?.toUpperCase() ?? "CFOP"}
                </span>

                {/* Status chip */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    ...mono,
                    fontSize: "9px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: dotColor,
                    background: `${dotColor}1a`,
                    borderRadius: "20px",
                    padding: "2px 8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {STATUS_LABEL[analysis.status]}
                </span>

                {/* Date */}
                <span
                  style={{
                    ...mono,
                    fontSize: "11px",
                    fontWeight: 400,
                    color: "var(--t3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDate(analysis.created_at)}
                </span>

                {/* Action link */}
                <Link
                  href={`/analysis/${analysis.id}`}
                  style={{
                    ...mono,
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "var(--blue)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ACTION_LABEL[analysis.status]} →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
