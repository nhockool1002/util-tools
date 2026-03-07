"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useZoom } from "@/contexts/zoom-context";
import { useLanguage } from "@/contexts/language-context";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

export function ZoomSwitch({ className }: { className?: string }) {
  const { zoomId, setZoomId, options } = useZoom();
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("shrink-0", className)}
          aria-label={t("zoom.ariaLabel")}
          title={t("zoom.title")}
        >
          <ZoomIn className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((opt) => (
          <DropdownMenuItem key={opt.id} onClick={() => setZoomId(opt.id)}>
            {opt.label}
            {zoomId === opt.id && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
