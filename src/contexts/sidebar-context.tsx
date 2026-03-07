"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "util-tools-sidebar-collapsed";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(getInitialCollapsed);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ collapsed, setCollapsed, toggle }),
    [collapsed, setCollapsed, toggle]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
