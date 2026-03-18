"use client";

import { startTransition, useCallback, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  applyTransformById,
  CONVERT_CASE_TRANSFORMS,
  type ConvertCaseTransformId,
} from "@/lib/convert-case";

export function ConvertCaseTool() {
  const { t, locale } = useLanguage();
  const [input, setInput] = useState("");
  const [transformId, setTransformId] = useState<ConvertCaseTransformId>("camel");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState<{ input: string; output: string }[]>([]);

  const transformOptions = useMemo(() => ({ locale }), [locale]);

  const applyWithHistory = useCallback(
    (nextTransformId?: ConvertCaseTransformId) => {
      const id = nextTransformId ?? transformId;
      startTransition(() => {
        setHistory((prev) => [{ input, output }, ...prev].slice(0, 20));
        setOutput(applyTransformById(input, id, transformOptions));
      });
    },
    [input, output, transformId, transformOptions]
  );

  const handleApply = useCallback(() => {
    applyWithHistory();
  }, [applyWithHistory]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setHistory([]);
  }, []);

  const handleSwap = useCallback(() => {
    setHistory((prev) => [{ input, output }, ...prev].slice(0, 20));
    setInput(output);
    setOutput(input);
  }, [input, output]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      const [latest, ...rest] = prev;
      if (!latest) return prev;
      setInput(latest.input);
      setOutput(latest.output);
      return rest;
    });
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("convertCase.inputLabel")}
        </label>
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOutput("");
          }}
          placeholder={t("convertCase.inputPlaceholder")}
          className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          rows={6}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("convertCase.transformLabel")}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {CONVERT_CASE_TRANSFORMS.map((tr) => {
            const active = tr.id === transformId;
            return (
              <Button
                key={tr.id}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => {
                  setTransformId(tr.id);
                  applyWithHistory(tr.id);
                }}
              >
                {t(tr.labelKey)}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleApply}>
            {t("convertCase.apply")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleUndo}
            disabled={history.length === 0}
          >
            {t("convertCase.undo")}
          </Button>
          <Button type="button" variant="outline" onClick={handleClear}>
            {t("convertCase.clear")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSwap}
            disabled={!output && !input}
          >
            {t("convertCase.swap")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("convertCase.outputLabel")}
        </label>
        <textarea
          readOnly
          value={output}
          placeholder={t("convertCase.outputPlaceholder")}
          className="min-h-[160px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 font-mono text-sm"
          rows={6}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!output}
          >
            {t("convertCase.copy")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("convertCase.tip")}
          </span>
        </div>
      </div>
    </div>
  );
}

