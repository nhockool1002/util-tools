"use client";

import { ThemeProvider } from "@/providers/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { FontProvider } from "@/contexts/font-context";
import { ZoomProvider } from "@/contexts/zoom-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { QuickSearchProvider } from "@/contexts/quick-search-context";
import { Buffer } from "buffer";

// Polyfill Buffer in the browser for font conversion libraries using Node-style Buffers
if (typeof window !== "undefined" && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FontProvider>
          <ZoomProvider>
            <SidebarProvider>
              <QuickSearchProvider>{children}</QuickSearchProvider>
            </SidebarProvider>
          </ZoomProvider>
        </FontProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
