"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

const localeKeys: Record<Locale, string> = {
  en: "common.english",
  vi: "common.vietnamese",
};

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("shrink-0", className)}
          aria-label={t("common.language")}
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale("en")}>
          {t(localeKeys.en)}
          {locale === "en" && " ✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("vi")}>
          {t(localeKeys.vi)}
          {locale === "vi" && " ✓"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
