import { Eye, Layers, Search, Timer } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalysisUploadClient } from "~/components/analysis/AnalysisUploadClient";
import { createClient } from "~/lib/supabase/server";
import type { AnalysisReport } from "~/types/analysis";

const FREE_MONTHLY_LIMIT = 3;

const FEATURES = [
  {
    Icon: Search,
    name: "Algorithm recognition",
    description:
      "Identifies which OLL, PLL, or CMLL case you executed and whether it matched the optimal algorithm.",
    iconBg: "var(--blue-dim)",
    iconColor: "var(--blue)",
  },
  {
    Icon: Timer,
    name: "Phase timing",
    description:
      "Breaks your solve into phases (Cross, F2L, OLL, PLL) and shows how long you spent in each.",
    iconBg: "var(--green-dim)",
    iconColor: "var(--green)",
  },
  {
    Icon: Eye,
    name: "Look-ahead & hesitation",
    description:
      "Detects pauses between phases and identifies where you lose time to recognition lag.",
    iconBg: "var(--red-dim)",
    iconColor: "var(--red)",
  },
  {
    Icon: Layers,
    name: "Execution quality",
    description:
      "Assesses smoothness and flow during algorithm execution at a high level.",
    iconBg: "var(--yellow-dim)",
    iconColor: "var(--yellow)",
  },
] as const;

const LIMIT_ROWS = [
  { label: "Max video length", value: "2 min" },
  { label: "Max file size", value: "200 MB" },
  { label: "Formats", value: "MP4 · MOV · WebM" },
] as const;

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function fmtTime(raw: string | undefined): string {
  if (!raw) return "—";
  const trimmed = raw.trim();
  let totalSec: number;
  if (trimmed.includes(":")) {
    const colonIdx = trimmed.indexOf(":");
    const m = Number.parseInt(trimmed.slice(0, colonIdx), 10);
    const s = Number.parseFloat(trimmed.slice(colonIdx + 1));
    totalSec = m * 60 + s;
  } else {
    totalSec = Number.parseFloat(trimmed);
  }
  if (Number.isNaN(totalSec)) return trimmed;
  if (totalSec >= 60) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toFixed(2).padStart(5, "0")}`;
  }
  return totalSec.toFixed(2);
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

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

  const profileMethod = profileResult.data?.method;
  const method: "cfop" | "beginner" =
    profileMethod === "beginner" ? "beginner" : "cfop";
  const recentAnalyses = recentResult.data ?? [];
  const usedThisMonth = usageResult.count ?? 0;
  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - usedThisMonth);
  const quotaPct = Math.min(
    100,
    Math.round((usedThisMonth / FREE_MONTHLY_LIMIT) * 100),
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 260px",
        minHeight: "100%",
      }}
    >
      {/* Main column */}
      <div
        style={{
          padding: "32px 36px 60px",
          borderRight: "0.5px solid var(--b1)",
        }}
      >
        <AnalysisUploadClient
          userId={user.id}
          initialMethod={method}
          usedThisMonth={usedThisMonth}
          usageLimit={FREE_MONTHLY_LIMIT}
        />
      </div>

      {/* Aside */}
      <aside
        style={{
          padding: "32px 24px 60px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {/* What gets analysed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p
            style={{
              ...mono,
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "var(--t3)",
            }}
          >
            What gets analysed
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {FEATURES.map(({ Icon, name, description, iconBg, iconColor }) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  gap: "11px",
                  padding: "11px 14px",
                  background: "var(--s1)",
                  border: "0.5px solid var(--b2)",
                  borderRadius: "10px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    background: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    size={14}
                    strokeWidth={1.6}
                    aria-hidden="true"
                    style={{ color: iconColor }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      ...sans,
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "var(--t1)",
                      marginBottom: "2px",
                    }}
                  >
                    {name}
                  </p>
                  <p
                    style={{
                      ...sans,
                      fontSize: "11.5px",
                      color: "var(--t3)",
                      lineHeight: 1.5,
                    }}
                  >
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Limits */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p
            style={{
              ...mono,
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "var(--t3)",
            }}
          >
            Limits
          </p>
          <div
            style={{
              background: "var(--s1)",
              border: "0.5px solid var(--b2)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {LIMIT_ROWS.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 14px",
                  borderBottom:
                    i < LIMIT_ROWS.length - 1
                      ? "0.5px solid var(--b1)"
                      : "none",
                }}
              >
                <span style={{ ...sans, fontSize: "12px", color: "var(--t2)" }}>
                  {row.label}
                </span>
                <span
                  style={{
                    ...mono,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--t1)",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quota */}
        <div
          style={{
            background: "var(--s1)",
            border: "0.5px solid var(--b2)",
            borderRadius: "12px",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ ...sans, fontSize: "12px", color: "var(--t2)" }}>
              Analyses this month
            </span>
            <span
              style={{
                ...mono,
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--yellow)",
              }}
            >
              {usedThisMonth} / {FREE_MONTHLY_LIMIT}
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "var(--s2)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "var(--yellow)",
                borderRadius: "2px",
                width: `${quotaPct}%`,
              }}
            />
          </div>
          <p
            style={{
              ...sans,
              fontSize: "11px",
              color: "var(--t3)",
              marginTop: "6px",
            }}
          >
            {remaining} {remaining === 1 ? "analysis" : "analyses"} remaining.
            Upgrade for unlimited.
          </p>
        </div>

        {/* Recent analyses */}
        {recentAnalyses.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  color: "var(--t3)",
                }}
              >
                Recent analyses
              </p>
              <Link
                href="/analysis/history"
                style={{
                  ...sans,
                  fontSize: "11px",
                  color: "var(--t3)",
                  textDecoration: "none",
                }}
              >
                View all →
              </Link>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {recentAnalyses.map((analysis) => {
                const report =
                  analysis.report as unknown as AnalysisReport | null;
                const methodLabel =
                  typeof analysis.method === "string"
                    ? analysis.method.toUpperCase()
                    : "CFOP";
                const solveTime = fmtTime(report?.estimated_total_time);
                const date = fmtDate(analysis.created_at as string);

                return (
                  <Link
                    key={analysis.id as string}
                    href={`/analysis/${analysis.id as string}`}
                    className="anl-recent-link"
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--green)",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          ...sans,
                          fontSize: "12.5px",
                          fontWeight: 500,
                          color: "var(--t1)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {methodLabel} · {date}
                      </p>
                      <p
                        style={{
                          ...mono,
                          fontSize: "10px",
                          color: "var(--t3)",
                          marginTop: "2px",
                        }}
                      >
                        {solveTime}
                      </p>
                    </div>
                    <span
                      style={{
                        ...mono,
                        fontSize: "13px",
                        color: "var(--t3)",
                        flexShrink: 0,
                      }}
                    >
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
