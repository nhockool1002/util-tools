"use client";

import { startTransition, useCallback, useRef, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { formatBytes, readFileAsText } from "@/lib/read-file-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHighlightSegments, type KeywordHighlight } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import { FileUp, Plus, Trash2 } from "lucide-react";

const ACCEPT_FILE_TYPES = ".txt,.md,.json,.csv,.log,.xml,.yml,.yaml,.text";
const DEFAULT_COLORS = [
  "#fef08a", // yellow
  "#bbf7d0", // green
  "#bfdbfe", // blue
  "#fbcfe8", // pink
  "#ddd6fe", // violet
  "#fed7aa", // orange
];

interface KeywordRow {
  id: string;
  text: string;
  color: string;
}

interface FindInFileProps {
  className?: string;
}

export function FindInFile({ className }: FindInFileProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      setLoadStatus(t("common.loading"));
      try {
        const result = await readFileAsText(file, "display");
        startTransition(() => {
          setContent(result.text);
          setLoadStatus(
            result.truncated
              ? t("common.fileTooLargeTruncated")
                  .replace("{{total}}", formatBytes(result.totalBytes))
                  .replace("{{loaded}}", formatBytes(result.loadedBytes))
              : null
          );
        });
      } catch (err) {
        setLoadStatus(err instanceof Error ? err.message : "Failed to load");
      }
    },
    [t]
  );

  const addKeyword = useCallback(() => {
    const color = DEFAULT_COLORS[keywords.length % DEFAULT_COLORS.length];
    setKeywords((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "", color },
    ]);
  }, [keywords.length]);

  const updateKeyword = useCallback((id: string, updates: Partial<KeywordRow>) => {
    setKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, ...updates } : k))
    );
  }, []);

  const removeKeyword = useCallback((id: string) => {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const keywordHighlights: KeywordHighlight[] = keywords
    .filter((k) => k.text.trim() !== "")
    .map((k) => ({ text: k.text.trim(), color: k.color }));

  const segments = getHighlightSegments(content, keywordHighlights);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Toolbar: Load file + Clear */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_FILE_TYPES}
          onChange={onFileChange}
          className="hidden"
          aria-hidden
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileUp className="size-4 shrink-0" />
          {t("findInFile.loadFile")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setContent("");
            setLoadStatus(null);
          }}
        >
          {t("findInFile.clearContent")}
        </Button>
        {loadStatus && (
          <span className="text-xs text-muted-foreground">{loadStatus}</span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {t("findInFile.pasteOrLoad")}
      </p>

      {/* Content editor */}
      <div className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("findInFile.contentPlaceholder")}
          className={cn(
            "min-h-[180px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          )}
          spellCheck={false}
        />
      </div>

      {/* Keywords */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {t("findInFile.keywords")}
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
            <Plus className="size-4 shrink-0" />
            {t("findInFile.addKeyword")}
          </Button>
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
                placeholder={t("findInFile.keywordPlaceholder")}
                className="flex-1 min-w-[120px]"
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
                aria-label={t("findInFile.removeKeyword")}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {/* Preview with highlights */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground">
          {t("findInFile.preview")}
        </h3>
        <div
          className={cn(
            "min-h-[120px] w-full rounded-lg border border-border bg-muted/30 px-3 py-2",
            "font-mono text-sm leading-relaxed whitespace-pre-wrap break-words"
          )}
        >
          {content ? (
            segments.map((seg, i) =>
              seg.type === "text" ? (
                <span key={i}>{seg.content}</span>
              ) : (
                <span
                  key={i}
                  style={{
                    backgroundColor: seg.color,
                    color: "inherit",
                    padding: "0 1px",
                    borderRadius: "2px",
                  }}
                >
                  {seg.content}
                </span>
              )
            )
          ) : (
            <span className="text-muted-foreground">
              {t("findInFile.noContent")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
