import { AppShell } from "~/components/layout/AppShell";
import { SidebarProvider } from "~/lib/sidebar-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShell>{children}</AppShell>
    </SidebarProvider>
  );
}
