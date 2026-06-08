import Link from "next/link";

function TimerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

const NAV_ITEMS = [
  {
    href: "/timer",
    title: "Open timer",
    subtitle: "Log a solve",
    Icon: TimerIcon,
    iconClass: "cb-icon-1",
  },
  {
    href: "/analysis",
    title: "New analysis",
    subtitle: "Upload a solve",
    Icon: VideoIcon,
    iconClass: "cb-icon-2",
  },
  {
    href: "/learn",
    title: "Browse lessons",
    subtitle: "Continue learning",
    Icon: BookIcon,
    iconClass: "cb-icon-3",
  },
  {
    href: "/library",
    title: "Library",
    subtitle: "Saved lessons",
    Icon: LibraryIcon,
    iconClass: "cb-icon-4",
  },
] as const;

const mono: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export function QuickNavGrid() {
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
        Quick navigation
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
        }}
      >
        {NAV_ITEMS.map(({ href, title, subtitle, Icon, iconClass }) => (
          <Link key={href} href={href} className="cb-nav-card">
            <div
              style={{
                width: "34px",
                height: "34px",
                background: "var(--s2)",
                border: "0.5px solid var(--b2)",
                borderRadius: "9px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--t3)",
                transition: "color 150ms",
              }}
              className={iconClass}
            >
              <Icon />
            </div>

            <div>
              <p
                style={{
                  ...sans,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--t1)",
                }}
              >
                {title}
              </p>
              <p
                style={{
                  ...sans,
                  fontSize: "11px",
                  fontWeight: 400,
                  color: "var(--t3)",
                  marginTop: "2px",
                }}
              >
                {subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
