"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { getHighlightSegments, type KeywordHighlight } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import { ClipboardPaste, Copy, Eraser, Plus, RefreshCw, Trash2 } from "lucide-react";

const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "svg",
  "tif",
  "tiff",
  "heic",
  "heif",
  "avif",
];

const VIDEO_EXTENSIONS = [
  "mp4",
  "mov",
  "mkv",
  "avi",
  "webm",
  "m4v",
  "wmv",
  "flv",
  "3gp",
  "mpeg",
  "mpg",
];

const DEFAULT_COLORS = [
  "#fef08a",
  "#bbf7d0",
  "#bfdbfe",
  "#fbcfe8",
  "#ddd6fe",
  "#fed7aa",
];

interface KeywordRow {
  id: string;
  text: string;
  replace: string;
  color: string;
}

interface ReplaceResult {
  text: string;
  replacedCount: number;
}

function HighlightTextarea({
  value,
  onChange,
  placeholder,
  highlights,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  highlights: KeywordHighlight[];
}) {
  const segments = useMemo(
    () => getHighlightSegments(value, highlights),
    [value, highlights]
  );

  return (
    <div className="relative min-h-[320px] w-full rounded-lg border border-input bg-background">
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 overflow-auto px-3 py-2 text-sm whitespace-pre-wrap break-words pointer-events-none",
          "text-foreground"
        )}
      >
        {value ? (
          segments.map((seg, i) =>
            seg.type === "text" ? (
              <span key={i}>{seg.content}</span>
            ) : (
              <span
                key={i}
                style={{
                  backgroundColor: seg.color,
                  color: "inherit",
                  borderRadius: "2px",
                  padding: "0 1px",
                }}
              >
                {seg.content}
              </span>
            )
          )
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "relative z-10 min-h-[320px] w-full resize-y rounded-lg bg-transparent px-3 py-2 text-sm",
          "text-transparent caret-foreground placeholder:text-transparent focus:outline-none focus:ring-2 focus:ring-ring"
        )}
        spellCheck={false}
      />
    </div>
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildAttachedRegex(exts: string[]): RegExp {
  const joined = exts.map(escapeRegex).join("|");
  return new RegExp(`<attached:\\s*[^>]+\\.(${joined})>`, "gi");
}

const IMAGE_ATTACHED_REGEX = buildAttachedRegex(IMAGE_EXTENSIONS);
const VIDEO_ATTACHED_REGEX = buildAttachedRegex(VIDEO_EXTENSIONS);

function normalizeText(input: string): string {
  return input
    .replace(IMAGE_ATTACHED_REGEX, "[Image Removed]")
    .replace(VIDEO_ATTACHED_REGEX, "[Video Removed]");
}

function countOccurrences(text: string, keyword: string): number {
  const q = keyword.trim();
  if (!q) return 0;
  return text.split(q).length - 1;
}

export function AttachmentCleaner() {
  const { t } = useLanguage();
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [columnRatio, setColumnRatio] = useState(50);
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [leftReplaceCount, setLeftReplaceCount] = useState<number | null>(null);
  const [rightReplaceCount, setRightReplaceCount] = useState<number | null>(null);
  const normalizedLeft = useMemo(() => normalizeText(leftText), [leftText]);
  const activeHighlights: KeywordHighlight[] = useMemo(
    () =>
      keywords
        .filter((k) => k.text.trim() !== "")
        .map((k) => ({ text: k.text.trim(), color: k.color })),
    [keywords]
  );

  useEffect(() => {
    setRightText(normalizedLeft);
  }, [normalizedLeft]);

  const addKeyword = () => {
    const color = DEFAULT_COLORS[keywords.length % DEFAULT_COLORS.length];
    setKeywords((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "", replace: "", color },
    ]);
  };

  const updateKeyword = (id: string, updates: Partial<KeywordRow>) => {
    setKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, ...updates } : k))
    );
  };

  const removeKeyword = (id: string) => {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  };

  const clearAll = () => {
    setLeftText("");
    setRightText("");
    setKeywords([]);
    setLeftReplaceCount(null);
    setRightReplaceCount(null);
  };

  const pasteToLeft = async () => {
    const text = await navigator.clipboard.readText();
    setLeftText(text);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const leftMatchCount = useMemo(
    () =>
      keywords.reduce(
        (sum, row) => sum + countOccurrences(leftText, row.text),
        0
      ),
    [keywords, leftText]
  );

  const rightMatchCount = useMemo(
    () =>
      keywords.reduce(
        (sum, row) => sum + countOccurrences(rightText, row.text),
        0
      ),
    [keywords, rightText]
  );

  const runReplace = (source: string): ReplaceResult => {
    return keywords.reduce<ReplaceResult>((acc, row) => {
      const find = row.text.trim();
      if (!find) return acc;
      const count = countOccurrences(acc.text, find);
      return {
        text: acc.text.replaceAll(find, row.replace),
        replacedCount: acc.replacedCount + count,
      };
    }, { text: source, replacedCount: 0 });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={pasteToLeft}>
          <ClipboardPaste className="size-4 shrink-0" />
          {t("attachmentCleaner.pasteLeft")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copyText(leftText)}
        >
          <Copy className="size-4 shrink-0" />
          {t("attachmentCleaner.copyLeft")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copyText(rightText)}
        >
          <Copy className="size-4 shrink-0" />
          {t("attachmentCleaner.copyRight")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearAll}>
          <Eraser className="size-4 shrink-0" />
          {t("attachmentCleaner.clearAll")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRightText(normalizeText(leftText))}
        >
          <RefreshCw className="size-4 shrink-0" />
          {t("attachmentCleaner.rebuildRight")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-foreground min-w-44">
          {t("attachmentCleaner.columnRatio")}
        </label>
        <input
          type="range"
          min={20}
          max={80}
          step={1}
          value={columnRatio}
          onChange={(e) => setColumnRatio(Number(e.target.value))}
          className="w-52"
        />
        <span className="text-xs text-muted-foreground">
          {columnRatio}% / {100 - columnRatio}%
        </span>
      </div>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `minmax(0, ${columnRatio}fr) minmax(0, ${100 - columnRatio}fr)`,
        }}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("attachmentCleaner.leftTitle")}
          </label>
          <div className="text-xs text-muted-foreground">
            {t("attachmentCleaner.matchCountLeft")}: {leftMatchCount}
          </div>
          <HighlightTextarea
            value={leftText}
            onChange={setLeftText}
            placeholder={t("attachmentCleaner.leftPlaceholder")}
            highlights={activeHighlights}
          />
          {leftReplaceCount !== null && (
            <p className="text-xs text-muted-foreground">
              {t("attachmentCleaner.replacedResult")}: {leftReplaceCount}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("attachmentCleaner.rightTitle")}
          </label>
          <div className="text-xs text-muted-foreground">
            {t("attachmentCleaner.matchCountRight")}: {rightMatchCount}
          </div>
          <HighlightTextarea
            value={rightText}
            onChange={setRightText}
            placeholder={t("attachmentCleaner.rightPlaceholder")}
            highlights={activeHighlights}
          />
          {rightReplaceCount !== null && (
            <p className="text-xs text-muted-foreground">
              {t("attachmentCleaner.replacedResult")}: {rightReplaceCount}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {t("attachmentCleaner.keywords")}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLeftText((prev) => {
                  const result = runReplace(prev);
                  setLeftReplaceCount(result.replacedCount);
                  return result.text;
                })
              }
            >
              {t("attachmentCleaner.replaceLeft")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setRightText((prev) => {
                  const result = runReplace(prev);
                  setRightReplaceCount(result.replacedCount);
                  return result.text;
                })
              }
            >
              {t("attachmentCleaner.replaceRight")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
              <Plus className="size-4 shrink-0" />
              {t("attachmentCleaner.addKeyword")}
            </Button>
          </div>
        </div>
        <ul className="flex flex-col gap-2">
          {keywords.map((k) => (
            <li
              key={k.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2"
              style={{ borderLeftWidth: 4, borderLeftColor: k.color }}
            >
              <Input
                value={k.text}
                onChange={(e) => updateKeyword(k.id, { text: e.target.value })}
                placeholder={t("attachmentCleaner.keywordPlaceholder")}
                className="flex-1 min-w-[150px]"
              />
              <Input
                value={k.replace}
                onChange={(e) => updateKeyword(k.id, { replace: e.target.value })}
                placeholder={t("attachmentCleaner.replacePlaceholder")}
                className="flex-1 min-w-[150px]"
              />
              <input
                type="color"
                value={k.color}
                onChange={(e) => updateKeyword(k.id, { color: e.target.value })}
                className="h-9 w-9 cursor-pointer rounded border border-input bg-background p-0.5"
                title={k.color}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeKeyword(k.id)}
                aria-label={t("attachmentCleaner.removeKeyword")}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <RefreshCw className="mt-0.5 size-4 shrink-0" />
          <p>{t("attachmentCleaner.hint")}</p>
        </div>
      </div>
    </div>
  );
}
