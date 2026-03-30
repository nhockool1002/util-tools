import type { CSSProperties } from "react";

export type SubtitleFontFamily =
  | "system"
  | "sans"
  | "serif"
  | "mono"
  | "cjk"
  | "verdana"
  | "tahoma"
  | "trebuchet"
  | "georgia"
  | "garamond"
  | "palatino"
  | "courier"
  | "impact";

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
  verdana: 'Verdana, Geneva, "DejaVu Sans", sans-serif',
  tahoma: 'Tahoma, "DejaVu Sans Condensed", Geneva, sans-serif',
  trebuchet: '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", sans-serif',
  georgia: 'Georgia, "Times New Roman", Times, serif',
  garamond: 'Garamond, "Palatino Linotype", Palatino, "Times New Roman", serif',
  palatino: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
  courier: '"Courier New", Courier, "Liberation Mono", monospace',
  impact: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
};

const TEXT_SHADOW: Record<SubtitleStyleState["textShadow"], string> = {
  none: "none",
  soft: "0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.6)",
  strong: "0 0 4px #000, 0 0 8px #000, 0 2px 4px rgba(0,0,0,1)",
};

const FONT_FAMILIES: SubtitleFontFamily[] = [
  "system",
  "sans",
  "serif",
  "mono",
  "cjk",
  "verdana",
  "tahoma",
  "trebuchet",
  "georgia",
  "garamond",
  "palatino",
  "courier",
  "impact",
];
const SHADOW_KEYS: SubtitleStyleState["textShadow"][] = ["none", "soft", "strong"];
const POSITION_KEYS: SubtitlePosition[] = [
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

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Chuẩn hoá dữ liệu từ localStorage / JSON để tránh crash khi render (null, sai kiểu, …). */
export function sanitizeSubtitleStyle(input: unknown): SubtitleStyleState {
  const base: SubtitleStyleState = { ...DEFAULT_SUBTITLE_STYLE };
  if (!input || typeof input !== "object") return base;

  const o = input as Record<string, unknown>;

  if (typeof o.fontFamily === "string" && FONT_FAMILIES.includes(o.fontFamily as SubtitleFontFamily)) {
    base.fontFamily = o.fontFamily as SubtitleFontFamily;
  }

  base.fontSizePx = clampNum(o.fontSizePx, 12, 48, DEFAULT_SUBTITLE_STYLE.fontSizePx);

  if (typeof o.textColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(o.textColor)) {
    base.textColor = o.textColor;
  }

  base.bgEnabled = typeof o.bgEnabled === "boolean" ? o.bgEnabled : base.bgEnabled;

  if (typeof o.bgColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(o.bgColor)) {
    base.bgColor = o.bgColor;
  }

  base.bgOpacity = clampNum(o.bgOpacity, 0, 1, DEFAULT_SUBTITLE_STYLE.bgOpacity);

  if (o.fontWeight === "normal" || o.fontWeight === "bold") base.fontWeight = o.fontWeight;
  if (o.fontStyle === "normal" || o.fontStyle === "italic") base.fontStyle = o.fontStyle;
  if (o.textDecoration === "none" || o.textDecoration === "underline") base.textDecoration = o.textDecoration;

  if (typeof o.textShadow === "string" && SHADOW_KEYS.includes(o.textShadow as SubtitleStyleState["textShadow"])) {
    base.textShadow = o.textShadow as SubtitleStyleState["textShadow"];
  }

  base.letterSpacingEm = clampNum(o.letterSpacingEm, -0.1, 0.3, DEFAULT_SUBTITLE_STYLE.letterSpacingEm);

  if (typeof o.position === "string" && POSITION_KEYS.includes(o.position as SubtitlePosition)) {
    base.position = o.position as SubtitlePosition;
  }

  base.maxWidthPct = clampNum(o.maxWidthPct, 40, 100, DEFAULT_SUBTITLE_STYLE.maxWidthPct);
  base.paddingY = clampNum(o.paddingY, 0, 32, DEFAULT_SUBTITLE_STYLE.paddingY);
  base.paddingX = clampNum(o.paddingX, 0, 48, DEFAULT_SUBTITLE_STYLE.paddingX);
  base.borderRadiusPx = clampNum(o.borderRadiusPx, 0, 24, DEFAULT_SUBTITLE_STYLE.borderRadiusPx);

  return base;
}

export function subtitleStyleToBoxStyle(s: SubtitleStyleState): CSSProperties {
  const family = FONT_STACK[s.fontFamily] ?? FONT_STACK.sans;
  const shadow = TEXT_SHADOW[s.textShadow] ?? TEXT_SHADOW.soft;
  const bg =
    s.bgEnabled && Number.isFinite(s.bgOpacity) && s.bgOpacity > 0
      ? hexToRgba(typeof s.bgColor === "string" ? s.bgColor : "#000000", clampNum(s.bgOpacity, 0, 1, 0.65))
      : "transparent";

  const fs = clampNum(s.fontSizePx, 12, 48, 22);
  const py = clampNum(s.paddingY, 0, 32, 6);
  const px = clampNum(s.paddingX, 0, 48, 12);
  const br = clampNum(s.borderRadiusPx, 0, 24, 6);
  const mw = clampNum(s.maxWidthPct, 40, 100, 92);
  const letter = clampNum(s.letterSpacingEm, -0.1, 0.3, 0);

  const textAlign = positionToTextAlign(s.position);

  return {
    fontFamily: family,
    fontSize: fs,
    fontWeight: s.fontWeight === "bold" ? "bold" : "normal",
    fontStyle: s.fontStyle === "italic" ? "italic" : "normal",
    textDecoration: s.textDecoration === "underline" ? "underline" : "none",
    color: typeof s.textColor === "string" ? s.textColor : "#ffffff",
    backgroundColor: bg,
    textShadow: shadow,
    letterSpacing: letter !== 0 ? `${letter}em` : undefined,
    padding: `${py}px ${px}px`,
    borderRadius: br,
    maxWidth: `${mw}%`,
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    textAlign,
  };
}

function positionToTextAlign(p: SubtitlePosition): "left" | "center" | "right" {
  if (p.endsWith("-left")) return "left";
  if (p.endsWith("-right")) return "right";
  return "center";
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Định vị khối phụ đề trong vùng video (absolute; flex-col trước đây đảo trục justify/items).
 */
export function positionToAbsoluteClasses(position: SubtitlePosition): string {
  const map: Record<SubtitlePosition, string> = {
    "top-left": "top-[6%] left-[3%] right-auto bottom-auto",
    "top-center": "top-[6%] left-1/2 right-auto bottom-auto -translate-x-1/2",
    "top-right": "top-[6%] right-[3%] left-auto bottom-auto",
    "middle-left": "top-1/2 left-[3%] right-auto bottom-auto -translate-y-1/2",
    "middle-center":
      "top-1/2 left-1/2 right-auto bottom-auto -translate-x-1/2 -translate-y-1/2",
    "middle-right": "top-1/2 right-[3%] left-auto bottom-auto -translate-y-1/2",
    "bottom-left": "bottom-[14%] left-[3%] right-auto top-auto",
    "bottom-center": "bottom-[14%] left-1/2 right-auto top-auto -translate-x-1/2",
    "bottom-right": "bottom-[14%] right-[3%] left-auto top-auto",
  };
  return map[position] ?? map["bottom-center"];
}

export function loadSubtitleStyle(): SubtitleStyleState {
  if (typeof window === "undefined") return DEFAULT_SUBTITLE_STYLE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBTITLE_STYLE);
    if (!raw) return DEFAULT_SUBTITLE_STYLE;
    const parsed: unknown = JSON.parse(raw);
    return sanitizeSubtitleStyle(parsed);
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
