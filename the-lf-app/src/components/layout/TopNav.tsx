"use client";

import {
  Bookmark,
  BookOpen,
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

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useUser();

  const displayName = profile?.display_name ?? user?.email ?? "User";
  const avatarUrl = profile?.avatar_url;
  const initials = displayName.slice(0, 1).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-border bg-background px-4">
      {/* Logo */}
      <div className="mr-6 flex shrink-0 items-center gap-2">
        <Image
          src="/icon.png"
          alt="Cubewise"
          width={24}
          height={24}
          className="h-6 w-6"
        />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Cubewise
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                active
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right: user */}
      <div className="ml-4 flex shrink-0 items-center gap-2">
        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-foreground">
              {initials}
            </div>
          )}
          <span className="hidden text-sm font-medium text-foreground sm:block">
            {displayName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
