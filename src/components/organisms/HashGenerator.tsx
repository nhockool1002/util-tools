"use client";

import { useCallback, useRef, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  computeHash,
  HASH_ALGORITHMS,
  type HashAlgorithmId,
} from "@/lib/hash-generator";
import { Copy } from "lucide-react";

export function HashGenerator() {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [algorithmId, setAlgorithmId] = useState<HashAlgorithmId>("sha256");
  const [hmacKey, setHmacKey] = useState("");
  const [result, setResult] = useState<{ hex: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(() => {
    const res = computeHash(input, algorithmId, hmacKey.trim() || undefined);
    if (res.success && res.hex) setResult({ hex: res.hex });
    else setResult(null);
  }, [input, algorithmId, hmacKey]);

  const handleLoadFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setInput(text);
        setResult(null);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    []
  );

  const handleCopy = useCallback(async () => {
    if (!result?.hex) return;
    await navigator.clipboard.writeText(result.hex);
  }, [result]);

  const handleClear = useCallback(() => {
    setInput("");
    setHmacKey("");
    setResult(null);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("hashGen.inputLabel")}
        </label>
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResult(null);
          }}
          placeholder={t("hashGen.inputPlaceholder")}
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          rows={5}
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="text/*,*"
            onChange={handleLoadFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {t("hashGen.loadFile")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            {t("hashGen.clear")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("hashGen.algorithm")}
        </label>
        <select
          value={algorithmId}
          onChange={(e) => {
            setAlgorithmId(e.target.value as HashAlgorithmId);
            setResult(null);
          }}
          className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {HASH_ALGORITHMS.map((algo) => (
            <option key={algo.id} value={algo.id}>
              {algo.name}
              {algo.description ? ` (${algo.description})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          {t("hashGen.hmacKey")}
        </label>
        <input
          type="text"
          value={hmacKey}
          onChange={(e) => {
            setHmacKey(e.target.value);
            setResult(null);
          }}
          placeholder={t("hashGen.hmacPlaceholder")}
          className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <Button type="button" onClick={handleGenerate}>
        {t("hashGen.generate")}
      </Button>

      {result && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 dark:bg-green-500/5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("hashGen.outputLabel")}:
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              <Copy className="mr-1 h-4 w-4" />
              {t("hashGen.copyHash")}
            </Button>
          </div>
          <p className="mt-2 break-all font-mono text-sm text-foreground">
            {result.hex}
          </p>
        </div>
      )}
    </div>
  );
}
