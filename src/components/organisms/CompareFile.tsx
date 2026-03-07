"use client";

import { startTransition, useCallback, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { compareLines, type DiffLine } from "@/lib/compare-text";
import { formatBytes, readFileAsText } from "@/lib/read-file-async";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Copy, FileDown, FileUp, Trash2 } from "lucide-react";

const MIN_HEIGHT = 200;

function DiffPanel({
  lines,
  showLineNumbers,
  scrollRef,
  onScroll,
}: {
  lines: DiffLine[];
  showLineNumbers: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}) {
  const bg = (type: string) =>
    type === "removed"
      ? "bg-red-500/15 dark:bg-red-500/20"
      : type === "added"
        ? "bg-emerald-500/15 dark:bg-emerald-500/20"
        : "";

  return (
    <div className="flex flex-1 min-w-0 flex-col border border-border rounded-lg overflow-hidden bg-muted/30">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex flex-1 overflow-auto font-mono text-sm"
        style={{ minHeight: MIN_HEIGHT }}
      >
        {lines.length === 0 ? (
          <div className="p-4 text-muted-foreground text-center w-full">
            —
          </div>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className={cn(bg(line.type), "group")}>
                  {showLineNumbers && (
                    <td className="w-10 shrink-0 py-0.5 pl-2 pr-2 text-right select-none text-muted-foreground border-r border-border align-top">
                      {line.lineNumber > 0 ? line.lineNumber : " "}
                    </td>
                  )}
                  <td className="py-0.5 pl-2 pr-2 align-top break-all whitespace-pre-wrap">
                    {line.text || "\u00A0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function CompareFile() {
  const { t } = useLanguage();
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [leftLoadStatus, setLeftLoadStatus] = useState<string | null>(null);
  const [rightLoadStatus, setRightLoadStatus] = useState<string | null>(null);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [syncScroll, setSyncScroll] = useState(true);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const result = useMemo(
    () =>
      compareLines(leftText, rightText, {
        ignoreWhitespace,
        ignoreCase,
      }),
    [leftText, rightText, ignoreWhitespace, ignoreCase]
  );

  const handleLoadFile = useCallback(
    (side: "left" | "right") => {
      const ref = side === "left" ? leftFileRef : rightFileRef;
      ref.current?.click();
    },
    []
  );

  const onFileChange = useCallback(
    async (side: "left" | "right", e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      const setStatus = side === "left" ? setLeftLoadStatus : setRightLoadStatus;
      setStatus(t("common.loading"));
      try {
        const result = await readFileAsText(file, "display");
        startTransition(() => {
          if (side === "left") setLeftText(result.text);
          else setRightText(result.text);
          setStatus(
            result.truncated
              ? t("common.fileTooLargeTruncated")
                  .replace("{{total}}", formatBytes(result.totalBytes))
                  .replace("{{loaded}}", formatBytes(result.loadedBytes))
              : null
          );
        });
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Failed to load");
      }
    },
    [t]
  );

  const handleClear = useCallback(() => {
    setLeftText("");
    setRightText("");
    setLeftLoadStatus(null);
    setRightLoadStatus(null);
  }, []);

  const handleSwap = useCallback(() => {
    setLeftText(rightText);
    setRightText(leftText);
  }, [leftText, rightText]);
  const buildUnifiedDiff = useCallback(() => {
    const lines: string[] = [];
    const max = Math.max(result.leftLines.length, result.rightLines.length);
    for (let i = 0; i < max; i++) {
      const L = result.leftLines[i];
      const R = result.rightLines[i];
      if (L?.type === "removed" && L.text) lines.push(`- ${L.text}`);
      if (R?.type === "added" && R.text) lines.push(`+ ${R.text}`);
      if (L?.type === "same" && R?.type === "same" && L.text) lines.push(`  ${L.text}`);
    }
    return lines.join("\n");
  }, [result]);

  const handleCopyResult = useCallback(() => {
    void navigator.clipboard.writeText(buildUnifiedDiff());
  }, [buildUnifiedDiff]);

  const handleExport = useCallback(
    (format: "html" | "md") => {
      const unified = buildUnifiedDiff();
      if (!unified.trim()) return;

      let content = "";
      let mime = "";
      let filename = "";

      if (format === "md") {
        content = ["```diff", unified, "```"].join("\n");
        mime = "text/markdown;charset=utf-8";
        filename = "compare-file-diff.md";
      } else {
        const htmlLines = unified.split("\n").map((line) => {
          if (line.startsWith("+")) {
            return `<span class=\"add\">${line}</span>`;
          }
          if (line.startsWith("-")) {
            return `<span class=\"rem\">${line}</span>`;
          }
          return `<span class=\"ctx\">${line}</span>`;
        });
        content = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Compare File Report</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; background: #020617; color: #e5e7eb; margin: 0; padding: 24px; }
    h1 { font-size: 20px; margin-bottom: 12px; }
    pre { background: #020617; border: 1px solid #1f2937; border-radius: 8px; padding: 16px; overflow: auto; font-size: 13px; line-height: 1.5; }
    .add { color: #4ade80; }
    .rem { color: #f97373; }
    .ctx { color: #e5e7eb; }
  </style>
</head>
<body>
  <h1>Compare File Diff</h1>
  <pre>
${htmlLines.join("\n")}
  </pre>
</body>
</html>`;
        mime = "text/html;charset=utf-8";
        filename = "compare-file-report.html";
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [buildUnifiedDiff]
  );

  const makeScrollHandler = useCallback(
    (source: "left" | "right") =>
      (e: React.UIEvent<HTMLDivElement>) => {
        if (!syncScroll) return;
        if (isSyncingRef.current) return;

        const sourceEl = e.currentTarget;
        const targetEl =
          source === "left" ? rightScrollRef.current : leftScrollRef.current;
        if (!targetEl) return;

        const sourceMax = Math.max(
          sourceEl.scrollHeight - sourceEl.clientHeight,
          1
        );
        const ratio = sourceEl.scrollTop / sourceMax;

        const targetMax = targetEl.scrollHeight - targetEl.clientHeight;

        isSyncingRef.current = true;
        targetEl.scrollTop = ratio * targetMax;
        isSyncingRef.current = false;
      },
    [syncScroll]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("compareFile.left")}
            </label>
            {leftLoadStatus && (
              <span className="text-xs text-muted-foreground">
                {leftLoadStatus}
              </span>
            )}
          </div>
          <textarea
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            placeholder={t("compareFile.leftPlaceholder")}
            className={cn(
              "min-h-[140px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("compareFile.right")}
            </label>
            {rightLoadStatus && (
              <span className="text-xs text-muted-foreground">
                {rightLoadStatus}
              </span>
            )}
          </div>
          <textarea
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            placeholder={t("compareFile.rightPlaceholder")}
            className={cn(
              "min-h-[140px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            spellCheck={false}
          />
        </div>
      </div>

      <input
        ref={leftFileRef}
        type="file"
        accept=".txt,.md,.json,.xml,.log,.csv,.text"
        className="hidden"
        onChange={(e) => onFileChange("left", e)}
      />
      <input
        ref={rightFileRef}
        type="file"
        accept=".txt,.md,.json,.xml,.log,.csv,.text"
        className="hidden"
        onChange={(e) => onFileChange("right", e)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleLoadFile("left")}
        >
          <FileUp className="size-4 shrink-0" />
          {t("compareFile.loadLeft")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleLoadFile("right")}
        >
          <FileUp className="size-4 shrink-0" />
          {t("compareFile.loadRight")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleSwap}>
          <ArrowLeftRight className="size-4 shrink-0" />
          {t("compareFile.swap")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleClear}>
          <Trash2 className="size-4 shrink-0" />
          {t("compareFile.clear")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleCopyResult}>
          <Copy className="size-4 shrink-0" />
          {t("compareFile.copyResult")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleExport("html")}
        >
          <FileDown className="size-4 shrink-0" />
          {t("compareFile.exportHtml")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleExport("md")}
        >
          <FileDown className="size-4 shrink-0" />
          {t("compareFile.exportMarkdown")}
        </Button>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={ignoreWhitespace}
            onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            className="rounded border-input"
          />
          {t("compareFile.ignoreWhitespace")}
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={ignoreCase}
            onChange={(e) => setIgnoreCase(e.target.checked)}
            className="rounded border-input"
          />
          {t("compareFile.ignoreCase")}
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={showLineNumbers}
            onChange={(e) => setShowLineNumbers(e.target.checked)}
            className="rounded border-input"
          />
          {t("compareFile.lineNumbers")}
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={(e) => setSyncScroll(e.target.checked)}
            className="rounded border-input"
          />
          {t("compareFile.syncScroll")}
        </label>
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-2">
          {t("compareFile.diffTitle")}
        </h3>
        <div className="flex gap-2 overflow-hidden rounded-lg border border-border">
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b border-border">
              {t("compareFile.removed")}
            </div>
            <DiffPanel
              lines={result.leftLines}
              showLineNumbers={showLineNumbers}
              scrollRef={leftScrollRef}
              onScroll={makeScrollHandler("left")}
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b border-border">
              {t("compareFile.added")}
            </div>
            <DiffPanel
              lines={result.rightLines}
              showLineNumbers={showLineNumbers}
              scrollRef={rightScrollRef}
              onScroll={makeScrollHandler("right")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
