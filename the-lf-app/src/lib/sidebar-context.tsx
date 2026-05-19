"use client";

import { createContext, useContext, useState } from "react";

interface SidebarCtx {
  hidden: boolean;
  setHidden: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarCtx>({
  hidden: false,
  setHidden: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  return (
    <SidebarContext.Provider value={{ hidden, setHidden }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
