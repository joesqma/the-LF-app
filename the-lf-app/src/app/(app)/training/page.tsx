export default function TrainingPage() {
  return (
    <div
      className="py-6 px-5 md:py-[48px] md:px-[56px]"
      style={{
        background: "var(--bg-base)",
        flex: 1,
        overflowY: "auto",
        minWidth: 0,
      }}
    >
      <p
        className="font-dm-sans"
        style={{
          fontSize: "13px",
          fontWeight: 400,
          color: "var(--text-dimmer)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        Training
      </p>
      <h1
        className="font-syne text-[28px] md:text-[38px]"
        style={{
          fontWeight: 800,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        Training
      </h1>
    </div>
  );
}
