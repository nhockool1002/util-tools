import type { CSSProperties } from "react";

export type SubtitleFontFamily = "system" | "sans" | "serif" | "mono" | "cjk";

export type SubtitlePosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface SubtitleStyleState {
  fontFamily: SubtitleFontFamily;
  fontSizePx: number;
  textColor: string;
  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  textShadow: "none" | "soft" | "strong";
  letterSpacingEm: number;
  position: SubtitlePosition;
  maxWidthPct: number;
  paddingY: number;
  paddingX: number;
  borderRadiusPx: number;
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyleState = {
  fontFamily: "sans",
  fontSizePx: 22,
  textColor: "#ffffff",
  bgEnabled: true,
  bgColor: "#000000",
  bgOpacity: 0.65,
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  textShadow: "soft",
  letterSpacingEm: 0,
  position: "bottom-center",
  maxWidthPct: 92,
  paddingY: 6,
  paddingX: 12,
  borderRadiusPx: 6,
};

export const STORAGE_KEY_SUBTITLE_STYLE = "localVideo.subtitleStyle.v1";

const FONT_STACK: Record<SubtitleFontFamily, string> = {
  system:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  sans: 'ui-sans-serif, "Noto Sans", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, "Noto Serif", "Times New Roman", Times, serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  cjk: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC","Hiragino Sans",sans-serif',
};

const TEXT_SHADOW: Record<SubtitleStyleState["textShadow"], string> = {
  none: "none",
  soft: "0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.6)",
  strong: "0 0 4px #000, 0 0 8px #000, 0 2px 4px rgba(0,0,0,1)",
};

export function subtitleStyleToBoxStyle(s: SubtitleStyleState): CSSProperties {
  const bg =
    s.bgEnabled && s.bgOpacity > 0
      ? hexToRgba(s.bgColor, s.bgOpacity)
      : "transparent";

  return {
    fontFamily: FONT_STACK[s.fontFamily],
    fontSize: s.fontSizePx,
    fontWeight: s.fontWeight,
    fontStyle: s.fontStyle,
    textDecoration: s.textDecoration,
    color: s.textColor,
    backgroundColor: bg,
    textShadow: TEXT_SHADOW[s.textShadow],
    letterSpacing: s.letterSpacingEm ? `${s.letterSpacingEm}em` : undefined,
    padding: `${s.paddingY}px ${s.paddingX}px`,
    borderRadius: s.borderRadiusPx,
    maxWidth: `${s.maxWidthPct}%`,
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    textAlign: "center",
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function positionToFlexClasses(position: SubtitlePosition): string {
  const map: Record<SubtitlePosition, string> = {
    "top-left": "items-start justify-start pt-[6%] pl-[3%]",
    "top-center": "items-start justify-center pt-[6%] px-[3%]",
    "top-right": "items-start justify-end pt-[6%] pr-[3%]",
    "middle-left": "items-center justify-start pl-[3%]",
    "middle-center": "items-center justify-center px-[3%]",
    "middle-right": "items-center justify-end pr-[3%]",
    "bottom-left": "items-end justify-start pb-[14%] pl-[3%]",
    "bottom-center": "items-end justify-center pb-[14%] px-[3%]",
    "bottom-right": "items-end justify-end pb-[14%] pr-[3%]",
  };
  return map[position];
}

export function loadSubtitleStyle(): SubtitleStyleState {
  if (typeof window === "undefined") return DEFAULT_SUBTITLE_STYLE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBTITLE_STYLE);
    if (!raw) return DEFAULT_SUBTITLE_STYLE;
    const parsed = JSON.parse(raw) as Partial<SubtitleStyleState>;
    return { ...DEFAULT_SUBTITLE_STYLE, ...parsed };
  } catch {
    return DEFAULT_SUBTITLE_STYLE;
  }
}

export function saveSubtitleStyle(s: SubtitleStyleState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_SUBTITLE_STYLE, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}
