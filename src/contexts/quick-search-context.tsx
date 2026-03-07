"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { QuickSearchContent } from "@/components/organisms/QuickSearch";

interface QuickSearchContextValue {
  openQuickSearch: () => void;
}

const QuickSearchContext = createContext<QuickSearchContextValue | null>(null);

export function useQuickSearch() {
  const ctx = useContext(QuickSearchContext);
  return ctx;
}

interface QuickSearchProviderProps {
  children: React.ReactNode;
}

export function QuickSearchProvider({ children }: QuickSearchProviderProps) {
  const [open, setOpenState] = useState(false);

  const openQuickSearch = useCallback(() => {
    setOpenState(true);
  }, []);

  const closeQuickSearch = useCallback(() => {
    setOpenState(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: Event) => {
      const ev = e as KeyboardEvent;
      if ((ev.metaKey || ev.ctrlKey) && ev.key === "k") {
        ev.preventDefault();
        setOpenState((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ openQuickSearch }), [openQuickSearch]);

  return (
    <QuickSearchContext.Provider value={value}>
      {children}
      <QuickSearchContent open={open} onClose={closeQuickSearch} />
    </QuickSearchContext.Provider>
  );
}
