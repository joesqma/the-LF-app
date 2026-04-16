"use client";

import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Settings,
  Timer,
  User,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "~/hooks/useUser";
import { createClient } from "~/lib/supabase/client";
import { cn } from "~/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/analysis", label: "Analysis", icon: Video },
  { href: "/library", label: "Library", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  const displayName = profile?.display_name ?? user?.email ?? "User";
  const avatarUrl = profile?.avatar_url;
  const xp = profile?.xp ?? 0;
  const initials = displayName.slice(0, 1).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-background transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center py-4",
          collapsed ? "flex-col gap-3 px-0" : "justify-between px-4",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2.5",
            collapsed && "justify-center",
          )}
        >
          <Image
            src="/icon.png"
            alt="Cubewise"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
          />
          {!collapsed && (
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Cubewise
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <ul className="flex flex-col gap-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-base transition-colors",
                    collapsed ? "justify-center gap-0" : "gap-3",
                    active
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-6 w-6 shrink-0" />
                  {!collapsed && label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-border px-2 py-4">
        <div
          className={cn(
            "mb-3 flex items-center",
            collapsed ? "justify-center" : "gap-3 px-2",
          )}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-foreground">
              {initials}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground">{xp} XP</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex w-full items-center rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed ? "justify-center" : "gap-2",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
