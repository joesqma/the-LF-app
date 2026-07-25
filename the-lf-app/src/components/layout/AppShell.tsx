"use client";

import { useSidebar } from "~/lib/sidebar-context";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { hidden } = useSidebar();
  return (
    <div className={hidden ? "app-shell app-shell--focus" : "app-shell"}>
      <Sidebar />
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
