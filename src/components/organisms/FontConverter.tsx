"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { convertFontFile, type FontConvertMode } from "@/lib/font-converter";

interface ConvertedItem {
  id: string;
  originalName: string;
  downloadName: string;
  blobUrl: string;
  sizeLabel: string;
  status: "processing" | "ready" | "error";
  error?: string;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

export function FontConverter() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<FontConvertMode>("to-woff2");
  const [isConverting, setIsConverting] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [items, setItems] = useState<ConvertedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progressTotal, setProgressTotal] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const progressDone = useMemo(
    () => items.filter((i) => i.status !== "processing").length,
    [items]
  );
  const progressPercent =
    progressTotal > 0 ? Math.round((progressDone / progressTotal) * 100) : 0;
  const showProgressBar = progressTotal > 0;

  const acceptAttr = useMemo(
    () =>
      mode === "to-woff2"
        ? ".ttf,.otf,.woff,.woff2"
        : ".woff,.woff2,.ttf,.otf",
    [mode]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);

      setError(null);
      setIsConverting(true);
      setProgressTotal(fileArray.length);

      // Revoke old object URLs and clear list
      setItems((prev) => {
        prev.forEach((it) => {
          if (it.blobUrl) URL.revokeObjectURL(it.blobUrl);
        });
        return [];
      });

      for (const [index, file] of fileArray.entries()) {
        const id = `${file.name}-${index}-${Date.now()}`;

        // Add placeholder row in processing state
        setItems((prev) => [
          ...prev,
          {
            id,
            originalName: file.name,
            downloadName: file.name,
            blobUrl: "",
            sizeLabel: "—",
            status: "processing",
          },
        ]);

        const res = await convertFontFile(file, mode);

        if (res.success && res.file) {
          const blobUrl = URL.createObjectURL(res.file.blob);
          const sizeLabel = formatBytes(res.file.blob.size);

          setItems((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    originalName: res.file!.originalName,
                    downloadName: res.file!.downloadName,
                    blobUrl,
                    sizeLabel,
                    status: "ready",
                    error: undefined,
                  }
                : item
            )
          );
        } else {
          setItems((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "error",
                    error: res.error || t("fontConv.errorConvert"),
                  }
                : item
            )
          );
        }
      }

      setIsConverting(false);
    },
    [mode, t]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      void handleFiles(e.target.files);
      // reset so selecting same files again still triggers change
      e.target.value = "";
    },
    [handleFiles]
  );

  const handleClear = useCallback(() => {
    setError(null);
    setProgressTotal(0);
    setIsDragging(false);
    setItems((prev) => {
      prev.forEach((it) => {
        if (it.blobUrl) URL.revokeObjectURL(it.blobUrl);
      });
      return [];
    });
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const readyItems = items.filter(
      (item) => item.status === "ready" && item.blobUrl
    );
    if (readyItems.length === 0) return;

    try {
      setIsDownloadingAll(true);
      const zip = new JSZip();

      for (const item of readyItems) {
        const response = await fetch(item.blobUrl);
        const blob = await response.blob();
        zip.file(item.downloadName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fonts.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingAll(false);
    }
  }, [items]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      const files = event.dataTransfer?.files;
      void handleFiles(files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
    },
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {t("fontConv.description")}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <label className="text-sm font-medium text-foreground">
          {t("fontConv.modeLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "to-woff2" ? "default" : "outline"}
            onClick={() => {
              setMode("to-woff2");
              setProgressTotal(0);
              setItems([]);
              setError(null);
            }}
          >
            {t("fontConv.toWoff2")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "to-ttf" ? "default" : "outline"}
            onClick={() => {
              setMode("to-ttf");
              setProgressTotal(0);
              setItems([]);
              setError(null);
            }}
          >
            {t("fontConv.toTtf")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("fontConv.selectFiles")}
        </label>
        <p className="text-xs text-muted-foreground">
          {t("fontConv.dropHint")}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptAttr}
          onChange={handleInputChange}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mt-1 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-background/40 px-4 py-6 text-center text-sm transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/70"
          }`}
        >
          <span className="font-medium text-foreground">
            {t("fontConv.selectFiles")}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            {t("fontConv.dropHint")}
          </span>
          <span className="mt-2 inline-flex items-center rounded-full border border-dashed border-border px-3 py-1 text-[11px] text-muted-foreground">
            {t("fontConv.dropBadge") ?? "Drop files here or click to browse"}
          </span>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={items.length === 0 && !error}
          >
            {t("base64.clear")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void handleDownloadAll();
            }}
            disabled={
              isDownloadingAll ||
              !items.some((item) => item.status === "ready" && item.blobUrl)
            }
          >
            {isDownloadingAll
              ? t("fontConv.converting")
              : t("fontConv.downloadAll")}
          </Button>
        </div>
      </div>

      {showProgressBar && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isConverting
                ? t("fontConv.converting")
                : t("fontConv.progressComplete")}{" "}
              ({progressDone} / {progressTotal})
            </span>
            {progressTotal > 0 && (
              <span className="font-medium text-foreground">
                {progressPercent}%
              </span>
            )}
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("fontConv.progressLabel")}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground">
          {t("fontConv.resultTitle")}
        </h3>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("fontConv.noResult")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-foreground">
                    {t("fontConv.fileName")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-foreground">
                    {t("fontConv.size")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-foreground">
                    {t("fontConv.status")}
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-foreground">
                    {t("fontConv.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-border/60">
                    <td className="px-3 py-2 align-top">
                      <div className="max-w-xs break-all">
                        <div className="font-medium text-foreground">
                          {item.downloadName}
                        </div>
                        {item.originalName !== item.downloadName && (
                          <div className="text-[11px] text-muted-foreground">
                            ({item.originalName})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                      {item.sizeLabel}
                    </td>
                    <td className="px-3 py-2 align-top text-xs">
                      {item.status === "ready" ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {t("fontConv.statusReady")}
                        </span>
                      ) : item.status === "processing" ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          {t("fontConv.statusProcessing")}
                        </span>
                      ) : (
                        <span className="text-destructive">
                          {t("fontConv.statusError")}
                        </span>
                      )}
                      {item.error && (
                        <div className="mt-1 max-w-xs break-words text-[11px] text-muted-foreground">
                          {item.error}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      {item.status === "ready" && item.blobUrl && (
                        <a
                          href={item.blobUrl}
                          download={item.downloadName}
                          className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          {t("fontConv.download")}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

