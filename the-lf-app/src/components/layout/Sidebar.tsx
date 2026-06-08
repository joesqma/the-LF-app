"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  Bookmark,
  BookOpen,
  LayoutDashboard,
  Settings,
  Timer,
  User,
  Video,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSidebar } from "~/lib/sidebar-context";
import { createClient } from "~/lib/supabase/client";

const NAV_GROUPS: Array<{
  label: string | null;
  items: Array<{ href: string; label: string; Icon: LucideIcon }>;
}> = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard }],
  },
  {
    label: "TRAIN",
    items: [
      { href: "/timer", label: "Timer", Icon: Timer },
      { href: "/training", label: "Training", Icon: Zap },
      { href: "/analysis", label: "Analysis", Icon: Video },
    ],
  },
  {
    label: "LEARN",
    items: [
      { href: "/learn", label: "Learn", Icon: BookOpen },
      { href: "/library", label: "Library", Icon: Bookmark },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { href: "/stats", label: "Stats", Icon: BarChart2 },
      { href: "/profile", label: "Profile", Icon: User },
      { href: "/settings", label: "Settings", Icon: Settings },
    ],
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { hidden } = useSidebar();
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      setProfile({
        name: data?.display_name ?? user.email?.split("@")[0] ?? "User",
        email: user.email ?? "",
      });
    });
  }, []);

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "220px",
        height: "100vh",
        background: "var(--s1)",
        borderRight: "0.5px solid var(--b1)",
        zIndex: 100,
        display: hidden ? "none" : "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <Image
          src="/icon.png"
          alt="Cubewise"
          width={32}
          height={32}
          style={{ objectFit: "contain" }}
        />
        <span
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--t1)",
            letterSpacing: "0.1px",
          }}
        >
          Cubewise
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label ?? "main"}>
            {group.label && (
              <div
                style={{
                  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
                  fontSize: "9px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  color: "var(--t3)",
                  padding: "12px 16px 4px",
                }}
              >
                {group.label}
              </div>
            )}
            {group.items.map(({ href, label, Icon }) => {
              const active =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  className={active ? undefined : "cb-nav-item"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    position: "relative",
                    padding: "8px 14px",
                    textDecoration: "none",
                    fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                    fontSize: "14px",
                    fontWeight: active ? 500 : 400,
                    ...(active
                      ? { color: "var(--blue)", background: "var(--blue-dim)" }
                      : {}),
                    transition: "color 150ms, background-color 150ms",
                  }}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "2px",
                        background: "var(--blue)",
                      }}
                    />
                  )}
                  <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Profile cell */}
      <div
        style={{
          margin: "8px 12px 12px",
          padding: "10px",
          background: "var(--s2)",
          border: "0.5px solid var(--b1)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "var(--blue-dim)",
            border: "0.5px solid var(--b3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--blue)",
            }}
          >
            {profile ? getInitials(profile.name) : "?"}
          </span>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--t1)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {profile?.name ?? "—"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
              fontSize: "10px",
              fontWeight: 400,
              color: "var(--t3)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {profile?.email ?? ""}
          </div>
        </div>
      </div>
    </aside>
  );
}
