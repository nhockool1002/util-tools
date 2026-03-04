"use client";

import { AnimatedThemeToggle } from "@/components/ui/animated-theme-toggle";
import { LanguageSwitch } from "@/components/molecules/LanguageSwitch";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  className?: string;
}

export function AppHeader({ title, className }: AppHeaderProps) {
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
        <LanguageSwitch />
        <AnimatedThemeToggle />
      </div>
    </header>
  );
}
