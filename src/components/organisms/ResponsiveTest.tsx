"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { ExternalLink, RefreshCw, RotateCw } from "lucide-react";

type DeviceType = "phone" | "tablet";
type Orientation = "portrait" | "landscape";

interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  type: DeviceType;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: "iphone-se", name: "iPhone SE", width: 375, height: 667, type: "phone" },
  { id: "iphone-12", name: "iPhone 12/13/14", width: 390, height: 844, type: "phone" },
  { id: "pixel-7", name: "Pixel 7", width: 412, height: 915, type: "phone" },
  { id: "ipad-mini", name: "iPad Mini", width: 768, height: 1024, type: "tablet" },
  { id: "ipad-air", name: "iPad Air", width: 820, height: 1180, type: "tablet" },
];

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ResponsiveTest() {
  const { t } = useLanguage();
  const [urlInput, setUrlInput] = useState("https://example.com");
  const [loadedUrl, setLoadedUrl] = useState("https://example.com");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [selectedPresetId, setSelectedPresetId] = useState(DEVICE_PRESETS[1].id);
  const [customWidth, setCustomWidth] = useState(390);
  const [customHeight, setCustomHeight] = useState(844);
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const selectedPreset = useMemo(
    () => DEVICE_PRESETS.find((item) => item.id === selectedPresetId) ?? DEVICE_PRESETS[0],
    [selectedPresetId]
  );

  const viewport = useMemo(() => {
    const baseWidth = useCustomSize ? Math.max(200, customWidth || 0) : selectedPreset.width;
    const baseHeight = useCustomSize ? Math.max(200, customHeight || 0) : selectedPreset.height;
    return orientation === "portrait"
      ? { width: baseWidth, height: baseHeight }
      : { width: baseHeight, height: baseWidth };
  }, [customHeight, customWidth, orientation, selectedPreset.height, selectedPreset.width, useCustomSize]);

  const applyLoadUrl = useCallback(() => {
    const normalized = normalizeUrl(urlInput);
    if (!normalized) return;
    setLoadedUrl(normalized);
    setUrlInput(normalized);
    setIsIframeLoaded(false);
    setShowFallback(false);
    setReloadToken((v) => v + 1);
  }, [urlInput]);

  const handleReload = useCallback(() => {
    if (!loadedUrl) return;
    setIsIframeLoaded(false);
    setShowFallback(false);
    setReloadToken((v) => v + 1);
  }, [loadedUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowFallback(true);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [loadedUrl, reloadToken]);

  const deviceGroups = useMemo(
    () => ({
      phone: DEVICE_PRESETS.filter((item) => item.type === "phone"),
      tablet: DEVICE_PRESETS.filter((item) => item.type === "tablet"),
    }),
    []
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 xl:sticky xl:top-4 xl:h-fit">
        <div className="flex flex-col gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={t("responsiveTest.urlPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyLoadUrl();
            }}
          />
          <div className="flex gap-2">
            <Button type="button" onClick={applyLoadUrl}>
              {t("responsiveTest.load")}
            </Button>
            <Button type="button" variant="outline" onClick={handleReload}>
              <RefreshCw className="mr-1 size-4" />
              {t("responsiveTest.reload")}
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-border p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("responsiveTest.orientation")}:</span>
            <Button
              type="button"
              size="sm"
              variant={orientation === "portrait" ? "default" : "outline"}
              onClick={() => setOrientation("portrait")}
            >
              {t("responsiveTest.portrait")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={orientation === "landscape" ? "default" : "outline"}
              onClick={() => setOrientation("landscape")}
            >
              {t("responsiveTest.landscape")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"))
              }
            >
              <RotateCw className="mr-1 size-4" />
              {t("responsiveTest.rotate")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("responsiveTest.deviceDetectNote")}</p>
        </div>

        <div className="rounded-md border border-border p-3">
          <p className="mb-2 text-sm font-medium text-foreground">{t("responsiveTest.presets")}</p>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {t("responsiveTest.phone")}
            </span>
            <div className="flex flex-wrap gap-2">
              {deviceGroups.phone.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={!useCustomSize && selectedPresetId === item.id ? "default" : "outline"}
                  onClick={() => {
                    setUseCustomSize(false);
                    setSelectedPresetId(item.id);
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </div>
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {t("responsiveTest.tablet")}
            </span>
            <div className="flex flex-wrap gap-2">
              {deviceGroups.tablet.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={!useCustomSize && selectedPresetId === item.id ? "default" : "outline"}
                  onClick={() => {
                    setUseCustomSize(false);
                    setSelectedPresetId(item.id);
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border p-3">
          <p className="mb-2 text-sm font-medium text-foreground">{t("responsiveTest.customSize")}</p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={200}
              value={customWidth}
              onChange={(e) => setCustomWidth(Number(e.target.value) || 0)}
              placeholder="Width"
            />
            <Input
              type="number"
              min={200}
              value={customHeight}
              onChange={(e) => setCustomHeight(Number(e.target.value) || 0)}
              placeholder="Height"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" onClick={() => setUseCustomSize(true)}>
              {t("responsiveTest.applyCustom")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setUseCustomSize(false)}
            >
              {t("responsiveTest.usePreset")}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {t("responsiveTest.currentViewport")}: {viewport.width} x {viewport.height}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open(loadedUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="mr-1 size-4" />
            {t("responsiveTest.openNewTab")}
          </Button>
        </div>

        <div className="overflow-auto rounded-md border border-border bg-background p-4">
          <div
            className="relative mx-auto overflow-hidden rounded-md border border-border bg-white"
            style={{ width: viewport.width, height: viewport.height }}
          >
            <iframe
              key={`${loadedUrl}-${reloadToken}`}
              src={loadedUrl}
              title="Responsive Preview"
              className="h-full w-full"
              onLoad={() => {
                setIsIframeLoaded(true);
                setShowFallback(false);
              }}
            />
          </div>
        </div>

        {!isIframeLoaded && !showFallback && (
          <p className="mt-3 text-sm text-muted-foreground">{t("responsiveTest.loadingHint")}</p>
        )}

        {showFallback && (
          <div className="mt-3 rounded-md border border-amber-400/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            <p>{t("responsiveTest.fallbackMessage")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
