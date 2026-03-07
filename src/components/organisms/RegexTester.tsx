"use client";

import {
  startTransition,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  KeyboardEvent,
} from "react";
import { useLanguage } from "@/contexts/language-context";
import { formatBytes, readFileAsText } from "@/lib/read-file-async";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  REGEX_FLAGS,
  validateRegex,
  getRegexMatches,
  getHighlightSegments,
  replaceAll,
  filterSuggestions,
  type RegexFlag,
  type RegexMatchItem,
  type HighlightSegment,
} from "@/lib/regex-tester";
import { AlertCircle, Copy, FileUp, Lightbulb, Trash2 } from "lucide-react";

const HIGHLIGHT_FULL = "bg-emerald-500/30 dark:bg-emerald-500/25 border-b border-emerald-500/50";
const HIGHLIGHT_GROUP = [
  "bg-blue-500/25 dark:bg-blue-500/20 border-b border-blue-500/50",
  "bg-violet-500/25 dark:bg-violet-500/20 border-b border-violet-500/50",
  "bg-pink-500/25 dark:bg-pink-500/20 border-b border-pink-500/50",
  "bg-amber-500/25 dark:bg-amber-500/20 border-b border-amber-500/50",
  "bg-cyan-500/25 dark:bg-cyan-500/20 border-b border-cyan-500/50",
];

function HighlightedText({
  segments,
  className,
}: {
  segments: HighlightSegment[];
  className?: string;
}) {
  return (
    <div
      className={cn("font-mono text-sm whitespace-pre-wrap break-words", className)}
      style={{ minHeight: "120px" }}
    >
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.content}</span>;
        }
        if (seg.type === "fullMatch") {
          return (
            <span key={i} className={cn("rounded-sm", HIGHLIGHT_FULL)}>
              {seg.content}
            </span>
          );
        }
        const g = (seg.groupIndex ?? 1) - 1;
        return (
          <span
            key={i}
            className={cn("rounded-sm", HIGHLIGHT_GROUP[g % HIGHLIGHT_GROUP.length])}
          >
            {seg.content}
          </span>
        );
      })}
    </div>
  );
}

export function RegexTester() {
  const { t } = useLanguage();
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState<RegexFlag[]>(["g", "d"]);
  const [replacement, setReplacement] = useState("");
  const [replaceResult, setReplaceResult] = useState<string | null>(null);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const patternInputRef = useRef<HTMLInputElement>(null);
  const suggestionListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);

  const validation = useMemo(
    () => (pattern.trim() ? validateRegex(pattern, flags) : { valid: true as const }),
    [pattern, flags]
  );

  const matchResult = useMemo(() => {
    if (!pattern.trim() || !validation.valid) return { success: false as const, matches: [] as RegexMatchItem[] };
    return getRegexMatches(pattern, testString, flags);
  }, [pattern, testString, flags, validation.valid]);

  const segments = useMemo(() => {
    if (!matchResult.success) return [{ type: "text" as const, content: testString }];
    return getHighlightSegments(testString, matchResult.matches);
  }, [testString, matchResult]);

  const suggestions = useMemo(
    () => filterSuggestions(pattern, 14),
    [pattern]
  );

  const toggleFlag = useCallback((flag: RegexFlag) => {
    setFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  }, []);

  const handleReplace = useCallback(() => {
    if (!pattern.trim()) return;
    const result = replaceAll(pattern, testString, replacement, flags);
    setReplaceResult(result.success ? result.result : testString);
  }, [pattern, testString, replacement, flags]);

  const handleInsertSuggestion = useCallback(
    (insert: string) => {
      const input = patternInputRef.current;
      if (input) {
        const start = input.selectionStart ?? pattern.length;
        const end = input.selectionEnd ?? pattern.length;
        const next = pattern.slice(0, start) + insert + pattern.slice(end);
        setPattern(next);
        setSuggestionOpen(false);
        requestAnimationFrame(() => {
          input.focus();
          input.setSelectionRange(start + insert.length, start + insert.length);
        });
      } else {
        setPattern((p) => p + insert);
        setSuggestionOpen(false);
      }
    },
    [pattern]
  );

  useEffect(() => {
    if (!suggestionOpen) return;
    setSuggestionIndex(0);
  }, [suggestionOpen, pattern]);

  useEffect(() => {
    if (!suggestionOpen || suggestions.length === 0) return;
    const el = suggestionListRef.current;
    const child = el?.children[suggestionIndex] as HTMLElement | undefined;
    child?.scrollIntoView({ block: "nearest" });
  }, [suggestionOpen, suggestionIndex, suggestions.length]);

  const onPatternKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!suggestionOpen) {
        if (e.key === " " && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          setSuggestionOpen(true);
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleInsertSuggestion(suggestions[suggestionIndex]?.insert ?? "");
        return;
      }
      if (e.key === "Escape") {
        setSuggestionOpen(false);
      }
    },
    [suggestionOpen, suggestions, suggestionIndex, handleInsertSuggestion]
  );

  const copyReplaceResult = useCallback(async () => {
    if (replaceResult != null) await navigator.clipboard.writeText(replaceResult);
  }, [replaceResult]);

  const clearAll = useCallback(() => {
    setPattern("");
    setTestString("");
    setReplacement("");
    setReplaceResult(null);
    setSuggestionOpen(false);
    setLoadStatus(null);
  }, []);

  const handleLoadFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      setLoadStatus(t("common.loading"));
      try {
        const result = await readFileAsText(file, "display");
        startTransition(() => {
          setTestString(result.text);
          setReplaceResult(null);
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

  const hasGroups = matchResult.matches.some((m) => m.groups.length > 0);
  const maxGroups = matchResult.matches.reduce(
    (acc, m) => Math.max(acc, m.groups.length),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Pattern + Flags */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-foreground">
            {t("regex.pattern")}
          </label>
          <div className="relative flex-1 min-w-[200px]">
            <input
              ref={patternInputRef}
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              onFocus={() => setSuggestionOpen(true)}
              onBlur={() => setTimeout(() => setSuggestionOpen(false), 180)}
              onKeyDown={onPatternKeyDown}
              placeholder={t("regex.patternPlaceholder")}
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                validation.valid === false && "border-destructive focus:ring-destructive/30"
              )}
              spellCheck={false}
            />
            {suggestionOpen && (
              <div
                ref={suggestionListRef}
                className="absolute z-20 left-0 right-0 mt-1 py-1 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg max-h-64 overflow-auto"
              >
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border flex items-center gap-1">
                  <Lightbulb className="size-3.5" />
                  {t("regex.suggestions")} (Ctrl+Space)
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.insert}-${i}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleInsertSuggestion(s.insert);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm font-mono flex items-center justify-between gap-2",
                      i === suggestionIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted/70"
                    )}
                  >
                    <span className="truncate">{s.label}</span>
                    {s.description && (
                      <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[180px]">
                        {s.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSuggestionOpen((o) => !o)}
            title={t("regex.suggestions")}
          >
            <Lightbulb className="size-4" />
          </Button>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("regex.flags")}:</span>
          {REGEX_FLAGS.map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-1.5 cursor-pointer text-sm"
              title={f.description}
            >
              <input
                type="checkbox"
                checked={flags.includes(f.id)}
                onChange={() => toggleFlag(f.id)}
                className="rounded border-input"
              />
              <span className="font-mono">{f.label}</span>
            </label>
          ))}
        </div>

        {/* Error */}
        {validation.valid === false && validation.error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs">
              {validation.error}
            </pre>
          </div>
        )}
      </div>

      {/* Test string */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-foreground">
            {t("regex.testString")}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.log,.csv,.xml,.yml,.yaml,.text"
            className="hidden"
            aria-hidden
            onChange={handleLoadFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="size-4 shrink-0" />
            {t("regex.loadFile")}
          </Button>
          {loadStatus && (
            <span className="text-xs text-muted-foreground">{loadStatus}</span>
          )}
        </div>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder={t("regex.testStringPlaceholder")}
          className={cn(
            "min-h-[140px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          )}
          spellCheck={false}
        />
      </div>

      {/* Highlight preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("regex.highlightPreview")}
          </label>
          {matchResult.success && (
            <span className="text-xs text-muted-foreground">
              {matchResult.matches.length} {t("regex.matches")}
            </span>
          )}
        </div>
        <div className="rounded-lg border border-border bg-muted/30 dark:bg-muted/20 p-3 overflow-auto">
          {testString ? (
            <HighlightedText segments={segments} />
          ) : (
            <span className="text-muted-foreground text-sm">{t("regex.noTestString")}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className={cn("inline-block w-3 h-3 rounded border", HIGHLIGHT_FULL)} />
            {t("regex.legendFullMatch")}
          </span>
          {hasGroups && (
            <>
              {HIGHLIGHT_GROUP.slice(0, maxGroups).map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className={cn("inline-block w-3 h-3 rounded border", c)} />
                  {t("regex.legendGroup").replace("{{n}}", String(i + 1))}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Matches table */}
      {matchResult.success && matchResult.matches.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("regex.matchList")}
          </label>
          <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 border-b border-border font-medium">#</th>
                  <th className="text-left px-3 py-2 border-b border-border font-medium">
                    {t("regex.index")}
                  </th>
                  <th className="text-left px-3 py-2 border-b border-border font-medium">
                    {t("regex.fullMatch")}
                  </th>
                  {maxGroups > 0 &&
                    Array.from({ length: maxGroups }, (_, i) => (
                      <th
                        key={i}
                        className="text-left px-3 py-2 border-b border-border font-medium"
                      >
                        {t("regex.group").replace("{{n}}", String(i + 1))}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {matchResult.matches.map((m, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-mono">{m.index}</td>
                    <td className="px-3 py-2 font-mono break-all">
                      {m.fullMatch || "—"}
                    </td>
                    {Array.from({ length: maxGroups }, (_, g) => (
                      <td key={g} className="px-3 py-2 font-mono break-all">
                        {m.groups[g] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Replace */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("regex.replace")}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder={t("regex.replacePlaceholder")}
            className={cn(
              "flex-1 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 font-mono text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            )}
          />
          <Button type="button" size="sm" onClick={handleReplace}>
            {t("regex.replaceAll")}
          </Button>
        </div>
        {replaceResult != null && (
          <div className="flex flex-col gap-1">
            <div className="rounded-lg border border-border bg-muted/30 p-3 overflow-auto">
              <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                {replaceResult}
              </pre>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={copyReplaceResult}
            >
              <Copy className="size-4 mr-1" />
              {t("regex.copyResult")}
            </Button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clearAll}>
          <Trash2 className="size-4 mr-1" />
          {t("common.clear")}
        </Button>
      </div>
    </div>
  );
}
