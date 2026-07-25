"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  Bookmark,
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Settings,
  Timer,
  User,
  Video,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  if (hidden) return null;

  return (
    <>
      <header className="mobile-app-bar">
        <Link href="/dashboard" className="app-brand">
          <Image src="/icon.png" alt="" width={34} height={34} />
          <span>Cubewise</span>
        </Link>
        <button
          type="button"
          className="mobile-menu-button"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={mobileOpen ? "app-sidebar is-open" : "app-sidebar"}>
        <Link href="/dashboard" className="app-brand app-brand--desktop">
          <Image src="/icon.png" alt="" width={38} height={38} />
          <span>Cubewise</span>
        </Link>

        <div className="sidebar-intro">
          <span>Your training space</span>
          <p>Build speed with intention.</p>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label ?? "main"} className="sidebar-nav__group">
              {group.label && (
                <div className="sidebar-nav__label">{group.label}</div>
              )}
              {group.items.map(({ href, label, Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(`${href}/`));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={
                      active ? "sidebar-link is-active" : "sidebar-link"
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="sidebar-link__icon">
                      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span>{label}</span>
                    <ChevronRight className="sidebar-link__arrow" size={14} />
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Profile cell */}
        <Link
          href="/profile"
          className="sidebar-profile"
          onClick={() => setMobileOpen(false)}
        >
          <div className="sidebar-profile__avatar">
            <span>{profile ? getInitials(profile.name) : "?"}</span>
          </div>
          <div className="sidebar-profile__copy">
            <strong>{profile?.name ?? "Your profile"}</strong>
            <span>{profile?.email ?? "Loading account…"}</span>
          </div>
          <ChevronRight size={15} />
        </Link>
      </aside>
    </>
  );
}
