"use client";

import { useCallback, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { calculateKcv } from "@/lib/kcv";

const DEMO_KEYS = [
  "0123456789ABCDEF",
  "0123456789ABCDEF0123456789ABCDEF",
  "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
  "FEDCBA9876543210",
  "0000000000000000",
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
];

export function KcvCalculator() {
  const { t } = useLanguage();
  const [keyInput, setKeyInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calculateKcv> | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value.replace(/[^0-9A-Fa-f\s]/g, "");
    setKeyInput(v);
    setResult(null);
  };

  const handleCalculate = useCallback(() => {
    const clean = keyInput.replace(/\s/g, "").trim();
    if (!clean) {
      setResult({ success: false, error: t("kcv.emptyKey") });
      return;
    }
    const res = calculateKcv(clean);
    setResult(res);
  }, [keyInput, t]);

  const handleDemo = useCallback(() => {
    const random = DEMO_KEYS[Math.floor(Math.random() * DEMO_KEYS.length)] ?? DEMO_KEYS[0];
    setKeyInput(random ?? "");
    setResult(null);
  }, []);

  const handleClear = useCallback(() => {
    setKeyInput("");
    setResult(null);
  }, []);

  const handleCopyKcv = useCallback(async () => {
    if (!result?.success || !result.kcv) return;
    await navigator.clipboard.writeText(result.kcv);
  }, [result]);

  const keyTypeLabels: Record<string, string> = {
    DES: "DES (16 hex)",
    "2KEY_3DES": "2-key 3DES (32 hex)",
    "3KEY_3DES": "3-key 3DES (48 hex)",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("kcv.keyLabel")}
        </label>
        <textarea
          value={keyInput}
          onChange={handleInputChange}
          placeholder={t("kcv.keyPlaceholder")}
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          {t("kcv.keyHint")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={handleCalculate}>
          {t("kcv.calculate")}
        </Button>
        <Button type="button" variant="outline" onClick={handleDemo}>
          {t("kcv.demo")}
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          {t("kcv.clear")}
        </Button>
      </div>

      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.success
              ? "border-green-500/50 bg-green-500/10 dark:bg-green-500/5"
              : "border-destructive/50 bg-destructive/10 dark:bg-destructive/5"
          }`}
        >
          {result.success ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {t("kcv.kcv")}:
                </span>
                <span className="font-mono text-lg font-semibold text-green-600 dark:text-green-400">
                  {result.kcv}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyKcv}
                >
                  {t("kcv.copyKcv")}
                </Button>
              </div>
              {result.keyType && (
                <p className="text-xs text-muted-foreground">
                  {t("kcv.keyType")}: {keyTypeLabels[result.keyType] ?? result.keyType}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-destructive">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
