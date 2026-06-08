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

interface Props {
  summary: string;
  estimatedTime: string;
  topPriorities: string[];
  scramble?: string | null;
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export function AnalysisSummaryCard({
  summary,
  estimatedTime,
  topPriorities,
  scramble,
}: Props) {
  const solveTime = fmtTime(estimatedTime);

  return (
    <div
      style={{
        position: "relative",
        background: "var(--s1)",
        border: "0.5px solid var(--b2)",
        borderRadius: "14px",
        padding: "20px 22px",
        overflow: "hidden",
      }}
    >
      {/* 2px orange accent bar */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "var(--orange)",
        }}
      />

      {/* Header row: label + solve time */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <p
          style={{
            ...mono,
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "2px",
            color: "var(--t3)",
          }}
        >
          Summary
        </p>
        {solveTime !== "—" && (
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                ...mono,
                fontSize: "30px",
                fontWeight: 700,
                letterSpacing: "-1px",
                lineHeight: 1,
                color: "var(--blue)",
              }}
            >
              {solveTime}
            </span>
            <p
              style={{
                ...sans,
                fontSize: "11px",
                fontWeight: 400,
                color: "var(--t3)",
                marginTop: "2px",
              }}
            >
              estimated time
            </p>
          </div>
        )}
      </div>

      {/* Summary text */}
      <p
        style={{
          ...sans,
          fontSize: "13px",
          fontWeight: 400,
          color: "var(--t2)",
          lineHeight: 1.65,
          marginBottom: topPriorities.length > 0 || scramble ? "16px" : 0,
        }}
      >
        {summary}
      </p>

      {/* Scramble */}
      {scramble && (
        <div style={{ marginBottom: topPriorities.length > 0 ? "16px" : 0 }}>
          <p
            style={{
              ...mono,
              fontSize: "9px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "var(--t3)",
              marginBottom: "6px",
            }}
          >
            Scramble
          </p>
          <p
            style={{
              ...mono,
              fontSize: "12px",
              fontWeight: 400,
              color: "var(--t3)",
              lineHeight: 1.5,
              wordBreak: "break-all",
            }}
          >
            {scramble}
          </p>
        </div>
      )}

      {/* Top priorities */}
      {topPriorities.length > 0 && (
        <div>
          <p
            style={{
              ...mono,
              fontSize: "9px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "var(--t3)",
              marginBottom: "8px",
            }}
          >
            Top priorities
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {topPriorities.map((priority, i) => (
              <div
                key={priority}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  background: "var(--s2)",
                  border: "0.5px solid var(--b1)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                <span
                  style={{
                    ...mono,
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "var(--orange)",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  {i + 1}
                </span>
                <p
                  style={{
                    ...sans,
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "var(--t1)",
                    lineHeight: 1.5,
                  }}
                >
                  {priority}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
