const mono: React.CSSProperties = {
  fontFamily: "var(--font-roboto-mono), 'Roboto Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export default function TrainingPage() {
  return (
    <div
      style={{
        padding: "32px 36px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        textAlign: "center",
      }}
    >
      <p
        style={{
          ...mono,
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--blue)",
          marginBottom: "20px",
        }}
      >
        Training
      </p>

      <h1
        style={{
          ...sans,
          fontSize: "clamp(56px, 10vw, 96px)",
          fontWeight: 800,
          letterSpacing: "-3px",
          lineHeight: 1,
          color: "var(--t1)",
          marginBottom: "24px",
        }}
      >
        Coming Soon!
      </h1>

      <p
        style={{
          ...sans,
          fontSize: "15px",
          color: "var(--t3)",
          lineHeight: 1.6,
          maxWidth: "380px",
        }}
      >
        Structured training plans, drill sessions, and progress tracking are on
        the way. Check back soon.
      </p>
    </div>
  );
}
