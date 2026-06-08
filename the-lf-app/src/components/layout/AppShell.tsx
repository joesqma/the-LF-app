"use client";

import { useSidebar } from "~/lib/sidebar-context";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { hidden } = useSidebar();
  return (
    <>
      <Sidebar />
      <main
        style={{
          marginLeft: hidden ? 0 : "220px",
          height: "100vh",
          overflowY: "auto",
          background: "var(--bg)",
        }}
      >
        {children}
      </main>
    </>
  );
}
