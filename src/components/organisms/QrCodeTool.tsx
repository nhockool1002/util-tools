"use client";

import { useCallback, useRef, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import * as QRCode from "qrcode";
import jsQR from "jsqr";

type TabId = "generate" | "read";

const QR_SIZE_OPTIONS = [128, 192, 256, 320];

export function QrCodeTool() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("generate");
  const [text, setText] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState(256);
  const [readResult, setReadResult] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) return;
    try {
      const url = await QRCode.toDataURL(text.trim(), {
        width: qrSize,
        margin: 2,
      });
      setQrDataUrl(url);
    } catch {
      setQrDataUrl(null);
    }
  }, [text, qrSize]);

  const handleDownload = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode.png";
    a.click();
  }, [qrDataUrl]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setReadResult(null);
      setReadError(null);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setReadError("Could not get canvas context");
          URL.revokeObjectURL(url);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        URL.revokeObjectURL(url);
        if (code) {
          setReadResult(code.data);
        } else {
          setReadError(t("qrCode.noQr"));
        }
      };
      img.onerror = () => {
        setReadError("Failed to load image");
        URL.revokeObjectURL(url);
      };
      img.src = url;
      e.target.value = "";
    },
    [t]
  );

  const handleCopyReadResult = useCallback(async () => {
    if (readResult) await navigator.clipboard.writeText(readResult);
  }, [readResult]);

  const handleClearGenerate = useCallback(() => {
    setText("");
    setQrDataUrl(null);
  }, []);

  const handleClearRead = useCallback(() => {
    setReadResult(null);
    setReadError(null);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("generate");
            handleClearGenerate();
            handleClearRead();
          }}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            activeTab === "generate"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("qrCode.generateTab")}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("read");
            handleClearGenerate();
            handleClearRead();
          }}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            activeTab === "read"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("qrCode.readTab")}
        </button>
      </div>

      {activeTab === "generate" && (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Content
            </label>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setQrDataUrl(null);
              }}
              placeholder={t("qrCode.textPlaceholder")}
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("qrCode.size")}:
              </span>
              <select
                value={qrSize}
                onChange={(e) => {
                  setQrSize(Number(e.target.value));
                  setQrDataUrl(null);
                }}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                {QR_SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}×{s}
                  </option>
                ))}
              </select>
              <Button type="button" onClick={handleGenerate}>
                {t("qrCode.generate")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearGenerate}
              >
                {t("hashGen.clear")}
              </Button>
            </div>
          </div>
          {qrDataUrl && (
            <div className="flex flex-col gap-2">
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="inline-block max-w-[320px] rounded border border-border"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="mr-1 h-4 w-4" />
                  {t("qrCode.download")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "read" && (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("qrCode.readTab")}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file?.type.startsWith("image/")) {
                  const fakeEvent = {
                    target: { files: [file] },
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileSelect(fakeEvent);
                }
              }}
              className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted/30"
            >
              {t("qrCode.readPlaceholder")}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearRead}
            >
              {t("hashGen.clear")}
            </Button>
          </div>
          {readError && (
            <p className="text-sm text-destructive">{readError}</p>
          )}
          {readResult && (
            <div className="rounded-lg border border-border bg-card p-4">
              <span className="text-sm font-medium text-foreground">
                {t("qrCode.readResult")}:
              </span>
              <pre className="mt-2 whitespace-pre-wrap break-all rounded bg-muted/50 p-3 text-sm">
                {readResult}
              </pre>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleCopyReadResult}
              >
                <Copy className="mr-1 h-4 w-4" />
                {t("qrCode.copy")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
