import Link from "next/link";
import type { AnalysisPhase, AnalysisReport } from "~/types/analysis";

interface AnalysisRow {
  id: string;
  method: "cfop" | "roux" | "beginner" | null;
  created_at: string;
  report: AnalysisReport | null;
}

interface Props {
  analyses: AnalysisRow[];
}

const METHOD_NAME: Record<string, string> = {
  cfop: "3×3 CFOP",
  roux: "3×3 Roux",
  beginner: "3×3 Beginner",
};

const PHASE_COLORS: Record<string, { bg: string; text: string }> = {
  CROSS: { bg: "var(--blue-dim)", text: "var(--blue)" },
  F2L: { bg: "var(--teal-dim)", text: "var(--teal)" },
  OLL: { bg: "var(--purple-dim)", text: "var(--purple)" },
  PLL: { bg: "var(--orange-dim)", text: "var(--orange)" },
};

function extractPhaseChips(phases: AnalysisPhase[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of phases) {
    const n = p.name.toLowerCase();
    if (n === "cross" && !seen.has("CROSS")) {
      seen.add("CROSS");
      result.push("CROSS");
    } else if (n.startsWith("f2l") && !seen.has("F2L")) {
      seen.add("F2L");
      result.push("F2L");
    } else if (n === "oll" && !seen.has("OLL")) {
      seen.add("OLL");
      result.push("OLL");
    } else if (n === "pll" && !seen.has("PLL")) {
      seen.add("PLL");
      result.push("PLL");
    }
  }
  return result;
}

function fmtTime(raw: string | undefined): string {
  if (!raw) return "—";
  const trimmed = raw.trim();
  let totalSec: number;
  if (trimmed.includes(":")) {
    const colonIdx = trimmed.indexOf(":");
    const m = parseInt(trimmed.slice(0, colonIdx), 10);
    const s = parseFloat(trimmed.slice(colonIdx + 1));
    totalSec = m * 60 + s;
  } else {
    totalSec = parseFloat(trimmed);
  }
  if (Number.isNaN(totalSec)) return trimmed;
  if (totalSec >= 60) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toFixed(2).padStart(5, "0")}`;
  }
  // Sub-minute: parseFloat then toFixed strips any leading zero padding
  return totalSec.toFixed(2);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export function RecentAnalysis({ analyses }: Props) {
  if (analyses.length === 0) return null;

  return (
    <div>
      <p
        style={{
          ...mono,
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--t3)",
          marginBottom: "12px",
        }}
      >
        Recent analysis
      </p>

      <div
        style={{
          background: "var(--s1)",
          border: "0.5px solid var(--b1)",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: "0.5px solid var(--b1)",
          }}
        >
          <span
            style={{
              ...sans,
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--t1)",
            }}
          >
            Last {analyses.length}{" "}
            {analyses.length === 1 ? "analysis" : "analyses"}
          </span>
          <Link
            href="/analysis/history"
            style={{
              ...mono,
              fontSize: "11px",
              fontWeight: 400,
              color: "var(--blue)",
              textDecoration: "none",
            }}
          >
            View all →
          </Link>
        </div>

        {/* Rows */}
        {analyses.map((a, i) => {
          const name = METHOD_NAME[a.method ?? "cfop"] ?? "3×3 CFOP";
          const chips = a.report?.phases
            ? extractPhaseChips(a.report.phases)
            : [];
          const solveTime = fmtTime(a.report?.estimated_total_time);
          const isLast = i === analyses.length - 1;

          return (
            <Link
              key={a.id}
              href={`/analysis/${a.id}`}
              className="cb-analysis-row"
              style={isLast ? { borderBottom: "none" } : undefined}
            >
              {/* Name + timestamp */}
              <div>
                <div
                  style={{
                    ...sans,
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--t1)",
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    ...mono,
                    fontSize: "11px",
                    fontWeight: 400,
                    color: "var(--t3)",
                    marginTop: "2px",
                  }}
                >
                  {fmtDate(a.created_at)}
                </div>
              </div>

              {/* Phase chips */}
              <div
                style={{
                  paddingLeft: "16px",
                  display: "flex",
                  gap: "4px",
                  flexWrap: "nowrap",
                }}
              >
                {chips.length > 0 ? (
                  chips.map((chip) => {
                    const colors = PHASE_COLORS[chip] ?? {
                      bg: "var(--s2)",
                      text: "var(--t3)",
                    };
                    return (
                      <span
                        key={chip}
                        style={{
                          borderRadius: "20px",
                          padding: "2px 7px",
                          ...mono,
                          fontSize: "9px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          background: colors.bg,
                          color: colors.text,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {chip}
                      </span>
                    );
                  })
                ) : (
                  <span
                    style={{ ...mono, fontSize: "10px", color: "var(--t3)" }}
                  >
                    —
                  </span>
                )}
              </div>

              {/* Solve time */}
              <div style={{ paddingLeft: "16px" }}>
                <span
                  style={{
                    ...mono,
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                    color: solveTime === "—" ? "var(--t3)" : "var(--t2)",
                  }}
                >
                  {solveTime}
                </span>
              </div>

              {/* Result badge */}
              <div style={{ paddingLeft: "16px" }}>
                <span
                  style={{
                    borderRadius: "6px",
                    padding: "3px 8px",
                    ...mono,
                    fontSize: "10px",
                    fontWeight: 600,
                    background: "var(--s2)",
                    border: "0.5px solid var(--b1)",
                    color: "var(--t3)",
                  }}
                >
                  DONE
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
