"use client";

import { useCallback, useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/language-context";

type Shade = { label: string; lightness: number };
type ColorFamily = { id: string; name: string; hue: number; saturation: number };
type Rgb = { r: number; g: number; b: number };

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  // h: [0..360), s/l: [0..100]
  const _h = ((h % 360) + 360) % 360;
  const _s = clamp01(s / 100);
  const _l = clamp01(l / 100);

  const c = (1 - Math.abs(2 * _l - 1)) * _s;
  const x = c * (1 - Math.abs(((_h / 60) % 2) - 1));
  const m = _l - c / 2;

  let r1 = 0,
    g1 = 0,
    b1 = 0;

  if (_h < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (_h < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (_h < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (_h < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (_h < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToCss(r: number, g: number, b: number) {
  return `rgb(${r}, ${g}, ${b})`;
}

function luminanceFromRgb({ r, g, b }: Rgb) {
  const toLinear = (channel: number) => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function getReadableTextColor(bgHex: string) {
  const m = bgHex.replace("#", "");
  if (m.length !== 6) return "#FFFFFF";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const lum = luminanceFromRgb({ r, g, b });
  // WCAG-ish heuristic: choose white text on dark colors, black on light.
  return lum > 0.55 ? "#0B0B10" : "#FFFFFF";
}

const SHADE_STEPS: Shade[] = [
  { label: "50", lightness: 96 },
  { label: "100", lightness: 90 },
  { label: "200", lightness: 82 },
  { label: "300", lightness: 72 },
  { label: "400", lightness: 60 },
  { label: "500", lightness: 48 },
  { label: "600", lightness: 38 },
  { label: "700", lightness: 28 },
  { label: "750", lightness: 24 },
  { label: "800", lightness: 20 },
  { label: "850", lightness: 16 },
  { label: "900", lightness: 14 },
  { label: "950", lightness: 10 },
];

// Curated HSL families for a “palette grid” look.
const COLOR_FAMILIES: ColorFamily[] = [
  { id: "yellow", name: "Yellow", hue: 52, saturation: 98 },
  { id: "amber", name: "Amber", hue: 40, saturation: 98 },
  { id: "orange", name: "Orange", hue: 26, saturation: 96 },
  { id: "brown", name: "Brown", hue: 18, saturation: 92 },
  { id: "red", name: "Red", hue: 0, saturation: 92 },
  { id: "rose", name: "Rose", hue: 350, saturation: 90 },
  { id: "pink", name: "Pink", hue: 330, saturation: 90 },
  { id: "fuchsia", name: "Fuchsia", hue: 300, saturation: 86 },
  { id: "purple", name: "Purple", hue: 270, saturation: 84 },
  { id: "indigo", name: "Indigo", hue: 245, saturation: 82 },
  { id: "blue", name: "Blue", hue: 220, saturation: 88 },
  { id: "sky", name: "Sky", hue: 200, saturation: 88 },
  { id: "cyan", name: "Cyan", hue: 184, saturation: 84 },
  { id: "teal", name: "Teal", hue: 166, saturation: 76 },
  { id: "emerald", name: "Emerald", hue: 152, saturation: 74 },
  { id: "green", name: "Green", hue: 135, saturation: 72 },
  { id: "lime", name: "Lime", hue: 106, saturation: 80 },
  { id: "neutral", name: "Neutral", hue: 0, saturation: 0 },
  { id: "gray", name: "Gray", hue: 220, saturation: 6 },
  { id: "stone", name: "Stone", hue: 210, saturation: 12 },
  { id: "slate", name: "Slate", hue: 220, saturation: 10 },
];

type Swatch = {
  familyId: string;
  familyName: string;
  shadeLabel: string;
  hex: string;
  rgb: string;
};

function generateSwatches() {
  const result: Swatch[][] = [];
  for (const family of COLOR_FAMILIES) {
    const shades: Swatch[] = [];
    for (const shade of SHADE_STEPS) {
      const rgb = hslToRgb(family.hue, family.saturation, shade.lightness);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      shades.push({
        familyId: family.id,
        familyName: family.name,
        shadeLabel: shade.label,
        hex,
        rgb: rgbToCss(rgb.r, rgb.g, rgb.b),
      });
    }
    result.push(shades);
  }
  return result;
}

// Column-major swatches: result[familyIndex][shadeIndex]
const SWATCHES_BY_FAMILY = generateSwatches();

// Target: increase visual density significantly.
// Area scales with CELL_PX^2, so 30px -> 60px yields ~4x area.
const CELL_PX = 60;
const CELL_GAP_PX = 3;

export function ColorPalettes() {
  const { t } = useLanguage();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const fallbackCopyText = useCallback((text: string) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    ta.setAttribute("readonly", "true");
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }
  }, []);

  const copyHex = useCallback(
    async (hex: string) => {
      try {
        await navigator.clipboard.writeText(hex);
      } catch {
        fallbackCopyText(hex);
      }

      setCopiedHex(hex);
      window.setTimeout(() => setCopiedHex((prev) => (prev === hex ? null : prev)), 1200);
    },
    [fallbackCopyText]
  );

  const copiedLabel = useMemo(() => {
    if (!copiedHex) return null;
    return t("colorPalettes.copied").replace("{{color}}", copiedHex);
  }, [copiedHex, t]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">{t("colorPalettes.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("colorPalettes.subtitle")}</p>
        </div>

        {copiedLabel && (
          <div className="rounded-lg border border-ring/30 bg-ring/10 px-3 py-2 text-sm font-medium">
            {copiedLabel}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-4">
        <div className="overflow-x-auto">
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${COLOR_FAMILIES.length}, ${CELL_PX}px)`,
              gap: `${CELL_GAP_PX}px`,
            }}
          >
            {SHADE_STEPS.map((_, shadeIndex) =>
              SWATCHES_BY_FAMILY.map((familySwatches) => {
                const swatch = familySwatches[shadeIndex];
                const isCopied = copiedHex === swatch.hex;

                return (
                  <Tooltip key={`${swatch.familyId}-${swatch.shadeLabel}`}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`${swatch.familyName} ${swatch.shadeLabel} ${swatch.hex}`}
                        onClick={() => copyHex(swatch.hex)}
                        className={[
                          "group relative h-[60px] w-[60px] rounded-[12px] border transition-all",
                          "border-white/10 dark:border-black/10",
                          "ring-1 ring-transparent hover:scale-[1.04] hover:ring-foreground/25",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                          isCopied
                            ? "ring-2 ring-ring/70"
                            : "",
                        ].join(" ")}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        <span className="sr-only">
                          {swatch.hex} ({swatch.familyName} {swatch.shadeLabel})
                        </span>

                        {/* Tiny corner mark to communicate “copied” */}
                        {isCopied && (
                          <span
                            className="absolute -top-[6px] -right-[6px] flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-background/80 text-[14px] font-semibold shadow-sm"
                            style={{ color: getReadableTextColor(swatch.hex) }}
                            aria-hidden
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} align="center">
                      <div className="flex flex-col gap-0.5">
                        <div className="font-mono text-xs leading-tight">{swatch.hex}</div>
                        <div className="text-[10px] opacity-80">{swatch.rgb}</div>
                        <div className="text-[10px] font-medium">
                          {isCopied
                            ? t("colorPalettes.copied").replace("{{color}}", swatch.hex)
                            : t("colorPalettes.clickToCopy")}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          {t("colorPalettes.helpLine")}
        </div>
      </div>
    </div>
  );
}

