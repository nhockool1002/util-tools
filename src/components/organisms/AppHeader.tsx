"use client";

import { AnimatedThemeToggle } from "@/components/ui/animated-theme-toggle";
import { LanguageSwitch } from "@/components/molecules/LanguageSwitch";
import { FontSwitch } from "@/components/molecules/FontSwitch";
import { ZoomSwitch } from "@/components/molecules/ZoomSwitch";
import { useQuickSearch } from "@/contexts/quick-search-context";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  className?: string;
}

export function AppHeader({ title, className }: AppHeaderProps) {
  const quickSearch = useQuickSearch();
  const { t } = useLanguage();

  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 md:px-8",
        className
      )}
    >
      {title && (
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      )}
      <div className="ml-auto flex items-center gap-3">
        {quickSearch && (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={quickSearch.openQuickSearch}
            aria-label={t("quickSearch.open")}
            title={t("quickSearch.open")}
          >
            <Search className="size-4" />
          </Button>
        )}
        <ZoomSwitch />
        <FontSwitch />
        <LanguageSwitch />
        <AnimatedThemeToggle />
      </div>
    </header>
  );
}
