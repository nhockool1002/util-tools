"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SubtitlePosition, SubtitleStyleState } from "@/lib/local-video-subtitle-style";
import { RotateCcw } from "lucide-react";

type TFn = (key: string) => string;

interface LocalVideoSubtitlePanelProps {
  value: SubtitleStyleState;
  onChange: (next: SubtitleStyleState) => void;
  onReset: () => void;
  t: TFn;
  className?: string;
}

const POSITIONS: SubtitlePosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "middle-center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

function patch<K extends keyof SubtitleStyleState>(
  v: SubtitleStyleState,
  key: K,
  val: SubtitleStyleState[K]
): SubtitleStyleState {
  return { ...v, [key]: val };
}

export function LocalVideoSubtitlePanel({
  value,
  onChange,
  onReset,
  t,
  className,
}: LocalVideoSubtitlePanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur-sm md:p-5",
        className
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("localVideo.subStyleTitle")}</h3>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onReset}>
          <RotateCcw className="size-3.5" aria-hidden />
          {t("localVideo.subStyleReset")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t("localVideo.subFontFamily")}>
          <select
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={value.fontFamily}
            onChange={(e) =>
              onChange(patch(value, "fontFamily", e.target.value as SubtitleStyleState["fontFamily"]))
            }
          >
            <option value="system">{t("localVideo.fontSystem")}</option>
            <option value="sans">{t("localVideo.fontSans")}</option>
            <option value="serif">{t("localVideo.fontSerif")}</option>
            <option value="mono">{t("localVideo.fontMono")}</option>
            <option value="cjk">{t("localVideo.fontCjk")}</option>
          </select>
        </Field>

        <Field label={t("localVideo.subFontSize")}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={12}
              max={48}
              step={1}
              value={value.fontSizePx}
              className="flex-1 accent-primary"
              onChange={(e) => onChange(patch(value, "fontSizePx", Number(e.target.value)))}
            />
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">{value.fontSizePx}px</span>
          </div>
        </Field>

        <Field label={t("localVideo.subTextColor")}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.textColor.length === 7 ? value.textColor : "#ffffff"}
              className="border-input h-9 w-12 cursor-pointer rounded border bg-transparent p-0.5"
              onChange={(e) => onChange(patch(value, "textColor", e.target.value))}
              aria-label={t("localVideo.subTextColor")}
            />
            <Input
              value={value.textColor}
              onChange={(e) => onChange(patch(value, "textColor", e.target.value))}
              className="font-mono text-xs"
              spellCheck={false}
            />
          </div>
        </Field>

        <Field label={t("localVideo.subBg")}>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.bgEnabled}
                onChange={(e) => onChange(patch(value, "bgEnabled", e.target.checked))}
                className="accent-primary"
              />
              {t("localVideo.subBgEnable")}
            </label>
            {value.bgEnabled && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={value.bgColor.length === 7 ? value.bgColor : "#000000"}
                  className="border-input h-9 w-12 cursor-pointer rounded border bg-transparent p-0.5"
                  onChange={(e) => onChange(patch(value, "bgColor", e.target.value))}
                  aria-label={t("localVideo.subBgColor")}
                />
                <span className="text-muted-foreground text-xs">{t("localVideo.subBgOpacity")}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={value.bgOpacity}
                  className="min-w-[100px] flex-1 accent-primary"
                  onChange={(e) => onChange(patch(value, "bgOpacity", Number(e.target.value)))}
                />
              </div>
            )}
          </div>
        </Field>

        <Field label={t("localVideo.subDecoration")}>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={value.fontWeight === "bold"}
                onChange={(e) =>
                  onChange(patch(value, "fontWeight", e.target.checked ? "bold" : "normal"))
                }
                className="accent-primary"
              />
              {t("localVideo.subBold")}
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={value.fontStyle === "italic"}
                onChange={(e) =>
                  onChange(patch(value, "fontStyle", e.target.checked ? "italic" : "normal"))
                }
                className="accent-primary"
              />
              {t("localVideo.subItalic")}
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={value.textDecoration === "underline"}
                onChange={(e) =>
                  onChange(patch(value, "textDecoration", e.target.checked ? "underline" : "none"))
                }
                className="accent-primary"
              />
              {t("localVideo.subUnderline")}
            </label>
          </div>
        </Field>

        <Field label={t("localVideo.subShadow")}>
          <select
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={value.textShadow}
            onChange={(e) =>
              onChange(patch(value, "textShadow", e.target.value as SubtitleStyleState["textShadow"]))
            }
          >
            <option value="none">{t("localVideo.shadowNone")}</option>
            <option value="soft">{t("localVideo.shadowSoft")}</option>
            <option value="strong">{t("localVideo.shadowStrong")}</option>
          </select>
        </Field>

        <Field label={t("localVideo.subLetterSpacing")}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={-0.1}
              max={0.3}
              step={0.02}
              value={value.letterSpacingEm}
              className="flex-1 accent-primary"
              onChange={(e) => onChange(patch(value, "letterSpacingEm", Number(e.target.value)))}
            />
            <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
              {value.letterSpacingEm.toFixed(2)}em
            </span>
          </div>
        </Field>

        <Field label={t("localVideo.subMaxWidth")}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={40}
              max={100}
              step={1}
              value={value.maxWidthPct}
              className="flex-1 accent-primary"
              onChange={(e) => onChange(patch(value, "maxWidthPct", Number(e.target.value)))}
            />
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">{value.maxWidthPct}%</span>
          </div>
        </Field>

        <Field label={t("localVideo.subPaddingRadius")}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground mb-1 block text-[10px] uppercase tracking-wide">
                {t("localVideo.subPadding")}
              </span>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min={0}
                  max={32}
                  value={value.paddingY}
                  className="h-8 text-xs"
                  onChange={(e) => onChange(patch(value, "paddingY", Math.max(0, Number(e.target.value) || 0)))}
                  aria-label="Y"
                />
                <Input
                  type="number"
                  min={0}
                  max={48}
                  value={value.paddingX}
                  className="h-8 text-xs"
                  onChange={(e) => onChange(patch(value, "paddingX", Math.max(0, Number(e.target.value) || 0)))}
                  aria-label="X"
                />
              </div>
            </div>
            <div>
              <span className="text-muted-foreground mb-1 block text-[10px] uppercase tracking-wide">
                {t("localVideo.subRadius")}
              </span>
              <Input
                type="number"
                min={0}
                max={24}
                value={value.borderRadiusPx}
                className="h-8 text-xs"
                onChange={(e) =>
                  onChange(patch(value, "borderRadiusPx", Math.max(0, Number(e.target.value) || 0)))
                }
              />
            </div>
          </div>
        </Field>
      </div>

      <div className="mt-5">
        <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
          {t("localVideo.subPosition")}
        </p>
        <div className="grid max-w-md grid-cols-3 gap-1.5">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => onChange(patch(value, "position", pos))}
              className={cn(
                "rounded-md border px-1 py-2 text-[11px] leading-tight transition-colors sm:text-xs",
                value.position === pos
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/70"
              )}
            >
              {t(`localVideo.pos.${pos}`)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground mt-3 text-[11px] leading-snug">{t("localVideo.subStyleNote")}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="text-muted-foreground mb-1.5 block text-xs font-medium">{label}</span>
      {children}
    </div>
  );
}
