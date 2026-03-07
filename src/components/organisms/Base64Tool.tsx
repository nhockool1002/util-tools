"use client";

import { startTransition, useCallback, useRef, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { formatBytes, readFileAsText } from "@/lib/read-file-async";
import { Button } from "@/components/ui/button";
import { encodeBase64, decodeBase64 } from "@/lib/base64";

type TabId = "encode" | "decode";

export function Base64Tool() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEncode = useCallback(() => {
    setError(null);
    const result = encodeBase64(input);
    setOutput(result || "");
  }, [input]);

  const handleDecode = useCallback(() => {
    setError(null);
    const result = decodeBase64(input);
    if (result.success && result.text !== undefined) {
      setOutput(result.text);
    } else {
      setOutput("");
      setError(result.error ?? t("base64.invalidBase64"));
    }
  }, [input, t]);

  const handleLoadFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      setLoadStatus(t("common.loading"));
      setError(null);
      try {
        const result = await readFileAsText(file, "base64");
        startTransition(() => {
          setInput(result.text);
          setOutput("");
          setLoadStatus(
            result.truncated
              ? t("common.fileTooLargeTruncated")
                  .replace("{{total}}", formatBytes(result.totalBytes))
                  .replace("{{loaded}}", formatBytes(result.loadedBytes))
              : null
          );
        });
      } catch (err) {
        setLoadStatus(null);
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    },
    [t]
  );

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
    setLoadStatus(null);
  }, []);

  const handleCopyOutput = useCallback(async () => {
    if (output) await navigator.clipboard.writeText(output);
  }, [output]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("encode");
            setInput("");
            setOutput("");
            setError(null);
          }}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            activeTab === "encode"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("base64.encodeTab")}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("decode");
            setInput("");
            setOutput("");
            setError(null);
          }}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            activeTab === "decode"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("base64.decodeTab")}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {activeTab === "encode" ? t("base64.encodeTab") : t("base64.decodeTab")}{" "}
          – Input
        </label>
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOutput("");
            setError(null);
          }}
          placeholder={t("base64.inputPlaceholder")}
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          rows={4}
        />
        <div className="flex gap-2">
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
            {t("base64.loadFile")}
          </Button>
          {loadStatus && (
            <span className="text-xs text-muted-foreground">{loadStatus}</span>
          )}
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            {t("base64.clear")}
          </Button>
          {activeTab === "encode" ? (
            <Button type="button" size="sm" onClick={handleEncode}>
              {t("base64.encode")}
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={handleDecode}>
              {t("base64.decode")}
            </Button>
          )}
        </div>
      </div>

      {(output || error) && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Output</label>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <textarea
            readOnly
            value={output}
            placeholder={t("base64.outputPlaceholder")}
            className="min-h-[100px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 font-mono text-sm"
            rows={4}
          />
          {output && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyOutput}
            >
              {t("base64.copy")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
