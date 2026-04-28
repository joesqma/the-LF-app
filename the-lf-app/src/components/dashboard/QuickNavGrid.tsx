import Link from "next/link";

function ClockIcon() {
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

const NAV_ITEMS = [
  {
    href: "/timer",
    title: "Open timer",
    subtitle: "Log a solve",
    Icon: ClockIcon,
  },
  {
    href: "/analysis",
    title: "New analysis",
    subtitle: "Upload a solve",
    Icon: VideoIcon,
  },
  {
    href: "/learn",
    title: "Browse lessons",
    subtitle: "Continue learning",
    Icon: BookIcon,
  },
] as const;

export function QuickNavGrid() {
  return (
    <div>
      <p
        className="font-dm-sans"
        style={{
          fontSize: "11px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-dimmer)",
          marginBottom: "16px",
        }}
      >
        Quick navigation
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {NAV_ITEMS.map(({ href, title, subtitle, Icon }) => (
          <Link key={href} href={href} className="db-nav-card">
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "1px solid var(--border-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="db-nav-icon">
                <Icon />
              </span>
            </div>

            <div>
              <p
                className="font-syne"
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                {title}
              </p>
              <p
                className="font-dm-sans"
                style={{
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "var(--text-dimmer)",
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
