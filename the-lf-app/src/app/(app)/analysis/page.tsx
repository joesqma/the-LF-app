import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalysisUploadClient } from "~/components/analysis/AnalysisUploadClient";
import { createClient } from "~/lib/supabase/server";
import type { AnalysisReport } from "~/types/analysis";

const FREE_MONTHLY_LIMIT = 3;

const FEATURES = [
  {
    emoji: "🔍",
    name: "Algorithm recognition",
    description:
      "Identifies which OLL, PLL, or CMLL case you executed and whether it matched the optimal algorithm.",
  },
  {
    emoji: "⏱️",
    name: "Phase timing",
    description:
      "Breaks your solve into phases (Cross, F2L, OLL, PLL) and shows how long you spent in each.",
  },
  {
    emoji: "👁️",
    name: "Look-ahead & hesitation",
    description:
      "Detects pauses between phases and identifies where you lose time to recognition lag.",
  },
  {
    emoji: "📋",
    name: "Execution quality",
    description:
      "Assesses smoothness and flow during algorithm execution at a high level.",
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function AnalysisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  const [profileResult, recentResult, usageResult] = await Promise.all([
    supabase.from("user_profiles").select("method").eq("id", user.id).single(),
    supabase
      .from("analyses")
      .select("id, status, report, created_at, method")
      .eq("user_id", user.id)
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth),
  ]);

  const method: "cfop" | "roux" =
    profileResult.data?.method === "roux" ? "roux" : "cfop";
  const recentAnalyses = recentResult.data ?? [];
  const usedThisMonth = usageResult.count ?? 0;
  const approachingLimit =
    usedThisMonth >= Math.ceil(FREE_MONTHLY_LIMIT * (2 / 3));

  return (
    <div
      className="anl-page-scroll"
      style={{
        background: "var(--bg-base)",
        flex: 1,
        overflowY: "auto",
        minWidth: 0,
        padding: "48px 56px 80px",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: "40px" }}>
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
          Analysis
        </p>
        <h1
          className="font-syne"
          style={{
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            lineHeight: 1.1,
          }}
        >
          AI Solve Analysis
        </h1>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnalysisUploadClient
            userId={user.id}
            initialMethod={method}
            usedThisMonth={usedThisMonth}
            usageLimit={FREE_MONTHLY_LIMIT}
          />
        </div>

        {/* Right column */}
        <div
          style={{
            width: "300px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Card 1: What Gets Analysed */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "14px",
              background: "var(--bg-card)",
              padding: "20px 22px",
            }}
          >
            <p
              className="font-dm-sans"
              style={{
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-dimmer)",
                fontWeight: 500,
                marginBottom: "14px",
              }}
            >
              What gets analysed
            </p>
            {FEATURES.map((feature, i) => (
              <div
                key={feature.name}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: i < FEATURES.length - 1 ? "14px" : 0,
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    border: "1px solid var(--border)",
                    background: "#111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                    fontSize: "13px",
                  }}
                >
                  {feature.emoji}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    className="font-dm-sans"
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: "2px",
                    }}
                  >
                    {feature.name}
                  </p>
                  <p
                    className="font-dm-sans"
                    style={{
                      fontSize: "11px",
                      fontWeight: 300,
                      color: "var(--text-dimmer)",
                      lineHeight: 1.5,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Card 2: Upload Limits */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "14px",
              background: "var(--bg-card)",
              padding: "20px 22px",
            }}
          >
            <p
              className="font-dm-sans"
              style={{
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-dimmer)",
                fontWeight: 500,
                marginBottom: "14px",
              }}
            >
              Upload limits
            </p>
            {(
              [
                {
                  label: "Max video length",
                  value: "2 minutes",
                  highlight: false,
                },
                { label: "Max file size", value: "200 MB", highlight: false },
                {
                  label: "Accepted formats",
                  value: "MP4, MOV, WebM",
                  highlight: false,
                },
                {
                  label: "Analyses this month",
                  value: `${usedThisMonth} / ${FREE_MONTHLY_LIMIT} free`,
                  highlight: approachingLimit,
                },
              ] as const
            ).map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: i === 0 ? 0 : "8px",
                  paddingBottom: i === arr.length - 1 ? 0 : "8px",
                  borderBottom:
                    i < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span
                  className="font-dm-sans"
                  style={{
                    fontSize: "12px",
                    fontWeight: 300,
                    color: "var(--text-dim)",
                  }}
                >
                  {row.label}
                </span>
                <span
                  className="font-dm-sans"
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: row.highlight
                      ? "var(--accent-blue)"
                      : "var(--text-muted)",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Card 3: Recent Analyses */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "14px",
              background: "var(--bg-card)",
              padding: "20px 22px",
            }}
          >
            <p
              className="font-dm-sans"
              style={{
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-dimmer)",
                fontWeight: 500,
                marginBottom: "14px",
              }}
            >
              Recent analyses
            </p>
            {recentAnalyses.length === 0 ? (
              <p
                className="font-dm-sans"
                style={{
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "var(--text-dimmer)",
                }}
              >
                No analyses yet.
              </p>
            ) : (
              recentAnalyses.map((analysis, i) => {
                const report =
                  analysis.report as unknown as AnalysisReport | null;
                const topPriority = report?.top_priorities?.[0];
                const methodLabel =
                  typeof analysis.method === "string"
                    ? analysis.method.toUpperCase()
                    : "CFOP";
                const title = topPriority
                  ? `${methodLabel} — ${topPriority}`
                  : methodLabel;
                const duration = report?.estimated_total_time ?? "";
                const date = formatDate(analysis.created_at as string);
                const meta = [date, duration].filter(Boolean).join(" · ");

                return (
                  <Link
                    key={analysis.id as string}
                    href={`/analysis/${analysis.id as string}`}
                    className="anl-recent-row font-dm-sans"
                    style={{
                      paddingTop: i === 0 ? 0 : "8px",
                      paddingBottom: i < recentAnalyses.length - 1 ? "8px" : 0,
                      borderBottom:
                        i < recentAnalyses.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#22c55e",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 400,
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {title}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 300,
                          color: "var(--text-dimmer)",
                        }}
                      >
                        {meta}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-dimmer)",
                        flexShrink: 0,
                      }}
                    >
                      →
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
