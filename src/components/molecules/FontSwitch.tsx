"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useFont } from "@/contexts/font-context";
import { useLanguage } from "@/contexts/language-context";
import { DEFAULT_FONT_ID } from "@/config/fonts";
import { Type } from "lucide-react";
import { cn } from "@/lib/utils";

export function FontSwitch({ className }: { className?: string }) {
  const { fontId, setFontId, fonts } = useFont();
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("shrink-0", className)}
          aria-label={t("font.ariaLabel")}
          title={t("font.title")}
        >
          <Type className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] overflow-y-auto min-w-[180px]">
        {fonts.map((font) => (
          <DropdownMenuItem
            key={font.id}
            onClick={() => setFontId(font.id)}
            style={
              font.id !== DEFAULT_FONT_ID
                ? { fontFamily: font.family }
                : undefined
            }
          >
            {font.id === DEFAULT_FONT_ID ? t("font.default") : font.label}
            {fontId === font.id && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
