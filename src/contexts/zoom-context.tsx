"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ZOOM_OPTIONS, DEFAULT_ZOOM_ID, getZoomOptionById, type ZoomOption } from "@/config/zoom";

const STORAGE_KEY = "util-tools-zoom";

interface ZoomContextValue {
  zoomId: string;
  setZoomId: (id: string) => void;
  scale: number;
  options: ZoomOption[];
}

const ZoomContext = createContext<ZoomContextValue | null>(null);

function getInitialZoomId(): string {
  if (typeof window === "undefined") return DEFAULT_ZOOM_ID;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && getZoomOptionById(stored) ? stored : DEFAULT_ZOOM_ID;
}

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const [zoomId, setZoomIdState] = useState<string>(getInitialZoomId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setZoomId = useCallback((id: string) => {
    if (!getZoomOptionById(id)) return;
    setZoomIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const option = useMemo(() => getZoomOptionById(zoomId) ?? ZOOM_OPTIONS[1], [zoomId]);
  const scale = option.scale;

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    document.documentElement.style.setProperty("--app-zoom", String(scale));
  }, [scale, mounted]);

  const value = useMemo(
    () => ({
      zoomId,
      setZoomId,
      scale,
      options: ZOOM_OPTIONS,
    }),
    [zoomId, setZoomId, scale]
  );

  return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>;
}

export function useZoom() {
  const ctx = useContext(ZoomContext);
  if (!ctx) throw new Error("useZoom must be used within ZoomProvider");
  return ctx;
}
