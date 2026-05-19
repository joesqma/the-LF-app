"use client";

import { useSidebar } from "~/lib/sidebar-context";
import { cn } from "~/lib/utils";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { hidden } = useSidebar();
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Keep sidebar mounted so collapsed state survives; just fade it */}
      <div
        className={cn(
          "transition-opacity duration-150",
          hidden && "opacity-0 pointer-events-none",
        )}
      >
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
