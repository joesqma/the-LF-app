import Link from "next/link";

interface Props {
  knowsHowToSolve: boolean;
}

export function DontKnowCTA({ knowsHowToSolve }: Props) {
  const href = knowsHowToSolve ? "/analysis" : "/learn/cfop/cfop-cross-1";

  return (
    <div style={{ marginTop: "32px" }}>
      <Link
        href={href}
        className="font-dm-sans"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          fontWeight: 400,
          color: "var(--text-dimmer)",
          textDecoration: "none",
          borderBottom: "1px dashed var(--border)",
          paddingBottom: "1px",
        }}
      >
        Don&apos;t know where to start?{" "}
        <span style={{ color: "var(--accent-blue)" }}>
          {knowsHowToSolve ? "Upload your first solve →" : "Start here →"}
        </span>
      </Link>
    </div>
  );
}
