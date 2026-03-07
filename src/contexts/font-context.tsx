"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { APP_FONTS, DEFAULT_FONT_ID, getFontById, type AppFont } from "@/config/fonts";

const STORAGE_KEY = "util-tools-font";

interface FontContextValue {
  fontId: string;
  setFontId: (id: string) => void;
  currentFont: AppFont;
  fonts: AppFont[];
}

const FontContext = createContext<FontContextValue | null>(null);

function getGoogleFontsUrl(googleFamily: string): string {
  return `https://fonts.googleapis.com/css2?family=${googleFamily}&display=swap`;
}

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontId, setFontIdState] = useState<string>(DEFAULT_FONT_ID);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && getFontById(stored)) setFontIdState(stored);
    setMounted(true);
  }, []);

  const setFontId = useCallback((id: string) => {
    if (!getFontById(id)) return;
    setFontIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const currentFont = useMemo(() => getFontById(fontId) ?? APP_FONTS[0], [fontId]);

  // Apply font to body and inject Google Fonts link when needed
  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;

    const font = getFontById(fontId);
    if (!font) return;

    const isDefault = font.id === DEFAULT_FONT_ID;
    const familyForBody = isDefault ? font.family : font.family;

    document.body.style.fontFamily = familyForBody;

    let linkEl: HTMLLinkElement | null = null;
    if (!isDefault && font.googleFamily) {
      linkEl = document.createElement("link");
      linkEl.rel = "stylesheet";
      linkEl.href = getGoogleFontsUrl(font.googleFamily);
      linkEl.setAttribute("data-util-tools-font", font.id);
      document.head.appendChild(linkEl);
    }

    return () => {
      if (linkEl?.parentNode) linkEl.parentNode.removeChild(linkEl);
    };
  }, [fontId, mounted]);

  const value = useMemo(
    () => ({
      fontId,
      setFontId,
      currentFont,
      fonts: APP_FONTS,
    }),
    [fontId, setFontId, currentFont]
  );

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}

export function useFont() {
  const ctx = useContext(FontContext);
  if (!ctx) throw new Error("useFont must be used within FontProvider");
  return ctx;
}
