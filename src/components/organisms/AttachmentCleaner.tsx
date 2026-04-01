"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
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

export function AttachmentCleaner() {
  const { t } = useLanguage();
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [columnRatio, setColumnRatio] = useState(50);
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const normalizedLeft = useMemo(() => normalizeText(leftText), [leftText]);

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
  };

  const pasteToLeft = async () => {
    const text = await navigator.clipboard.readText();
    setLeftText(text);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const runReplace = (source: string): string => {
    return keywords.reduce((result, row) => {
      const find = row.text.trim();
      if (!find) return result;
      return result.replaceAll(find, row.replace);
    }, source);
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
          <textarea
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            placeholder={t("attachmentCleaner.leftPlaceholder")}
            className={cn(
              "min-h-[220px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("attachmentCleaner.rightTitle")}
          </label>
          <textarea
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            placeholder={t("attachmentCleaner.rightPlaceholder")}
            className={cn(
              "min-h-[220px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            spellCheck={false}
          />
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
              onClick={() => setLeftText((prev) => runReplace(prev))}
            >
              {t("attachmentCleaner.replaceLeft")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRightText((prev) => runReplace(prev))}
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
