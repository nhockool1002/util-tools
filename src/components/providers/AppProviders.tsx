"use client";

import { ThemeProvider } from "@/providers/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { Buffer } from "buffer";

// Polyfill Buffer in the browser for font conversion libraries using Node-style Buffers
if (typeof window !== "undefined" && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
