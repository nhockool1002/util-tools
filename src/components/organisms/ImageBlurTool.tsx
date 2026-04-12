"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { EyeOff } from "lucide-react";

/** Tọa độ chuẩn hóa 0–1 theo kích thước ảnh gốc */
export type NormalizedRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type EffectMode = "blur" | "solid" | "mosaic";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/** Làm mờ vùng trên canvas không dùng ctx.filter (tương thích WebView / export ổn định). */
function drawBlurredRectFromImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  rw: number,
  rh: number,
  blurPx: number
) {
  const factor = Math.max(2, Math.min(72, blurPx * 1.25));
  const sw = Math.max(1, Math.floor(rw / factor));
  const sh = Math.max(1, Math.floor(rh / factor));
  const os = document.createElement("canvas");
  os.width = sw;
  os.height = sh;
  const octx = os.getContext("2d");
  if (!octx) return;
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "low";
  octx.drawImage(img, x, y, rw, rh, 0, 0, sw, sh);
  const prevSmooth = ctx.imageSmoothingEnabled;
  const prevQuality = ctx.imageSmoothingQuality;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";
  ctx.drawImage(os, 0, 0, sw, sh, x, y, rw, rh);
  ctx.imageSmoothingEnabled = prevSmooth;
  ctx.imageSmoothingQuality = prevQuality;
}

/** Mosaic: kéo giãn 1 pixel nguồn ra từng ô (kiểu che pixel). */
function drawMosaicRect(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  rw: number,
  rh: number,
  blockSize: number
) {
  const bs = Math.max(2, Math.round(blockSize));
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  for (let py = y; py < y + rh; py += bs) {
    for (let px = x; px < x + rw; px += bs) {
      const bw = Math.min(bs, x + rw - px);
      const bh = Math.min(bs, y + rh - py);
      const sx = Math.min(iw - 1, Math.floor(px + bw / 2));
      const sy = Math.min(ih - 1, Math.floor(py + bh / 2));
      ctx.drawImage(img, sx, sy, 1, 1, px, py, bw, bh);
    }
  }
  ctx.imageSmoothingEnabled = prev;
}

/** Giới hạn số ô vẽ khi preview (tránh lag khi vùng lớn / ảnh to). */
const MAX_MOSAIC_PREVIEW_CELLS = 5_000;

function drawMosaicMapped(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  srcX: number,
  srcY: number,
  srcW: number,
  srcH: number,
  blockSizeSrc: number,
  destX: number,
  destY: number,
  destW: number,
  destH: number
) {
  if (srcW < 1 || srcH < 1 || destW < 1 || destH < 1) return;
  const bs = Math.max(2, Math.round(blockSizeSrc));
  let blockDest = Math.max(2, bs * (destW / srcW));
  let cells = Math.ceil(destW / blockDest) * Math.ceil(destH / blockDest);
  while (cells > MAX_MOSAIC_PREVIEW_CELLS && blockDest < Math.max(destW, destH) / 2) {
    blockDest *= 1.35;
    cells = Math.ceil(destW / blockDest) * Math.ceil(destH / blockDest);
  }
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  for (let row = 0; row < destH; row += blockDest) {
    for (let col = 0; col < destW; col += blockDest) {
      const bw = Math.min(blockDest, destW - col);
      const bh = Math.min(blockDest, destH - row);
      const u = (col + bw / 2) / destW;
      const v = (row + bh / 2) / destH;
      const sx = Math.min(iw - 1, Math.floor(srcX + u * srcW));
      const sy = Math.min(ih - 1, Math.floor(srcY + v * srcH));
      ctx.drawImage(img, sx, sy, 1, 1, destX + col, destY + row, bw, bh);
    }
  }
  ctx.imageSmoothingEnabled = prev;
}

export function ImageBlurTool() {
  const { t } = useLanguage();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [regions, setRegions] = useState<NormalizedRect[]>([]);
  const regionsRef = useRef<NormalizedRect[]>([]);
  regionsRef.current = regions;

  const [effect, setEffect] = useState<EffectMode>("blur");
  const [blurPx, setBlurPx] = useState(16);
  const [solidColor, setSolidColor] = useState("#000000");
  const [mosaicBlockPx, setMosaicBlockPx] = useState(14);
  const mosaicBlockPreviewRef = useRef(mosaicBlockPx);
  mosaicBlockPreviewRef.current = mosaicBlockPx;

  /** Khóa đổi Blur/Solid/Mosaic: bật sau lần chọn chế độ đầu hoặc khi đã có vùng. */
  const [modeFrozen, setModeFrozen] = useState(false);

  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ nx: number; ny: number } | null>(null);
  /** Draft kéo vùng — không dùng state khi move (tránh lag). */
  const draftRef = useRef<NormalizedRect | null>(null);
  const draftBoxRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const mosaicCanvasRef = useRef<HTMLCanvasElement>(null);

  const mosaicPaintRafRef = useRef(0);
  const resizeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mosaicSliderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectLocked = modeFrozen || regions.length > 0;

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const unlockAndClearWork = useCallback(() => {
    setModeFrozen(false);
    setRegions([]);
    draftRef.current = null;
    if (draftBoxRef.current) draftBoxRef.current.style.display = "none";
  }, []);

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      revokeBlob();
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setRegions([]);
        setModeFrozen(false);
        draftRef.current = null;
      };
      img.onerror = () => {
        revokeBlob();
        setImage(null);
      };
      img.src = url;
    },
    [revokeBlob]
  );

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const getNormPoint = useCallback(
    (clientX: number, clientY: number): { nx: number; ny: number } | null => {
      const el = containerRef.current?.querySelector("[data-image-blur-target]");
      if (!el || !image) return null;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return null;
      const nx = (clientX - r.left) / r.width;
      const ny = (clientY - r.top) / r.height;
      return { nx: clamp01(nx), ny: clamp01(ny) };
    },
    [image]
  );

  const syncMosaicPreviewRef = useRef<() => void>(() => {});

  const scheduleMosaicPaint = useCallback(() => {
    if (mosaicPaintRafRef.current) return;
    mosaicPaintRafRef.current = requestAnimationFrame(() => {
      mosaicPaintRafRef.current = 0;
      syncMosaicPreviewRef.current();
    });
  }, []);

  const applyDraftBoxStyles = useCallback(
    (r: NormalizedRect | null) => {
      const el = draftBoxRef.current;
      if (!el) return;
      if (!r || r.w <= 0 || r.h <= 0) {
        el.style.display = "none";
        return;
      }
      el.style.display = "block";
      el.style.left = `${r.x * 100}%`;
      el.style.top = `${r.y * 100}%`;
      el.style.width = `${r.w * 100}%`;
      el.style.height = `${r.h * 100}%`;
      if (effect === "solid") {
        el.style.backgroundColor = solidColor;
        el.style.opacity = "0.85";
        el.style.backdropFilter = "";
        el.style.removeProperty("-webkit-backdrop-filter");
      } else if (effect === "mosaic") {
        /* Khi kéo: chỉ khung nhẹ — không vẽ mosaic canvas (tránh lag). */
        el.style.backgroundColor = "rgba(59, 130, 246, 0.18)";
        el.style.opacity = "1";
        el.style.backdropFilter = "";
        el.style.removeProperty("-webkit-backdrop-filter");
      } else {
        el.style.backgroundColor = "rgba(255,255,255,0.06)";
        el.style.opacity = "1";
        el.style.backdropFilter = `blur(${blurPx}px)`;
        el.style.setProperty("-webkit-backdrop-filter", `blur(${blurPx}px)`);
      }
    },
    [effect, solidColor, blurPx]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!image) return;
      const p = getNormPoint(e.clientX, e.clientY);
      if (!p) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drawStartRef.current = p;
      isDrawingRef.current = true;
      draftRef.current = { x: p.nx, y: p.ny, w: 0, h: 0 };
      applyDraftBoxStyles(draftRef.current);
    },
    [image, getNormPoint, applyDraftBoxStyles]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current || !drawStartRef.current) return;
      const p = getNormPoint(e.clientX, e.clientY);
      if (!p) return;
      const s = drawStartRef.current;
      const x1 = Math.min(s.nx, p.nx);
      const y1 = Math.min(s.ny, p.ny);
      const x2 = Math.max(s.nx, p.nx);
      const y2 = Math.max(s.ny, p.ny);
      draftRef.current = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
      applyDraftBoxStyles(draftRef.current);
    },
    [getNormPoint, applyDraftBoxStyles]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      isDrawingRef.current = false;
      drawStartRef.current = null;
      const d = draftRef.current;
      draftRef.current = null;
      if (draftBoxRef.current) draftBoxRef.current.style.display = "none";
      if (d && d.w > 0.002 && d.h > 0.002) {
        setRegions((prev) => [...prev, d]);
        setModeFrozen(true);
      }
      if (effect === "mosaic") {
        requestAnimationFrame(() => scheduleMosaicPaint());
      }
    },
    [effect, scheduleMosaicPaint]
  );

  const removeRegion = useCallback((index: number) => {
    setRegions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearRegions = useCallback(() => {
    setRegions([]);
    draftRef.current = null;
    if (draftBoxRef.current) draftBoxRef.current.style.display = "none";
  }, []);

  const resetImage = useCallback(() => {
    revokeBlob();
    setImage(null);
    setRegions([]);
    setModeFrozen(false);
    draftRef.current = null;
    if (draftBoxRef.current) draftBoxRef.current.style.display = "none";
  }, [revokeBlob]);

  const selectEffect = useCallback(
    (m: EffectMode) => {
      if (effectLocked && m !== effect) return;
      setEffect(m);
      setModeFrozen(true);
    },
    [effectLocked, effect]
  );

  const exportImage = useCallback(() => {
    if (!image) return;
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(image, 0, 0);

    for (const r of regionsRef.current) {
      const x = r.x * w;
      const y = r.y * h;
      const rw = r.w * w;
      const rh = r.h * h;
      if (rw < 1 || rh < 1) continue;

      if (effect === "solid") {
        ctx.fillStyle = solidColor;
        ctx.fillRect(x, y, rw, rh);
      } else if (effect === "mosaic") {
        drawMosaicRect(ctx, image, x, y, rw, rh, mosaicBlockPx);
      } else {
        drawBlurredRectFromImage(ctx, image, x, y, rw, rh, blurPx);
      }
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.download = "image-blur.png";
        a.href = URL.createObjectURL(blob);
        a.click();
        URL.revokeObjectURL(a.href);
        setModeFrozen(false);
        setRegions([]);
        draftRef.current = null;
        if (draftBoxRef.current) draftBoxRef.current.style.display = "none";
      },
      "image/png",
      1
    );
  }, [image, effect, blurPx, solidColor, mosaicBlockPx]);

  const clearMosaicCanvas = useCallback(() => {
    const canvas = mosaicCanvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const syncMosaicPreview = useCallback(() => {
    const canvas = mosaicCanvasRef.current;
    if (!canvas || !image) {
      clearMosaicCanvas();
      return;
    }

    if (effect !== "mosaic") {
      canvas.width = 0;
      canvas.height = 0;
      canvas.style.width = "0";
      canvas.style.height = "0";
      return;
    }

    const imgEl = imgRef.current;
    if (!imgEl) return;
    const dw = imgEl.clientWidth;
    const dh = imgEl.clientHeight;
    if (dw < 2 || dh < 2) return;
    const dpr = 1;
    canvas.style.width = `${dw}px`;
    canvas.style.height = `${dh}px`;
    canvas.width = Math.floor(dw * dpr);
    canvas.height = Math.floor(dh * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, dw, dh);

    const natW = image.naturalWidth;
    const natH = image.naturalHeight;
    const block = mosaicBlockPreviewRef.current;

    const paintRegion = (r: NormalizedRect) => {
      const sx = r.x * natW;
      const sy = r.y * natH;
      const sw = r.w * natW;
      const sh = r.h * natH;
      const dx = r.x * dw;
      const dy = r.y * dh;
      const ddw = r.w * dw;
      const ddh = r.h * dh;
      drawMosaicMapped(ctx, image, sx, sy, sw, sh, block, dx, dy, ddw, ddh);
    };

    for (const r of regionsRef.current) paintRegion(r);

    ctx.save();
    ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
    ctx.lineWidth = 2;
    for (const r of regionsRef.current) {
      ctx.strokeRect(r.x * dw, r.y * dh, r.w * dw, r.h * dh);
    }
    ctx.restore();
  }, [image, effect, clearMosaicCanvas]);

  syncMosaicPreviewRef.current = syncMosaicPreview;

  useEffect(() => {
    const raf = requestAnimationFrame(() => syncMosaicPreviewRef.current());
    return () => cancelAnimationFrame(raf);
  }, [regions, effect, image, syncMosaicPreview]);

  useEffect(() => {
    const t = mosaicSliderDebounceRef.current;
    if (t) clearTimeout(t);
    mosaicSliderDebounceRef.current = setTimeout(() => {
      mosaicSliderDebounceRef.current = null;
      scheduleMosaicPaint();
    }, 120);
    return () => {
      if (mosaicSliderDebounceRef.current) clearTimeout(mosaicSliderDebounceRef.current);
    };
  }, [mosaicBlockPx, scheduleMosaicPaint]);

  useEffect(() => {
    const el = imgRef.current;
    if (!el || !image) return;
    const ro = new ResizeObserver(() => {
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
      resizeDebounceRef.current = setTimeout(() => {
        resizeDebounceRef.current = null;
        scheduleMosaicPaint();
      }, 80);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
    };
  }, [image, scheduleMosaicPaint]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) loadFile(f);
    },
    [loadFile]
  );

  const modeButtonClass = (active: boolean, disabled: boolean) =>
    `rounded px-3 py-1.5 text-sm font-medium ${
      disabled
        ? "cursor-not-allowed opacity-50"
        : active
          ? "bg-primary text-primary-foreground"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
    }`;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("imageBlur.intro")}</p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) loadFile(f);
          }}
        />
        <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
          {t("imageBlur.chooseImage")}
        </Button>
        {image && (
          <>
            <Button type="button" variant="outline" onClick={clearRegions}>
              {t("imageBlur.clearRegions")}
            </Button>
            <Button type="button" variant="outline" onClick={resetImage}>
              {t("imageBlur.resetImage")}
            </Button>
            <Button type="button" variant="outline" onClick={unlockAndClearWork}>
              {t("imageBlur.finishSession")}
            </Button>
            <Button type="button" onClick={exportImage} disabled={regions.length === 0}>
              {t("imageBlur.exportPng")}
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-4 border-b border-border pb-4">
        <div
          className="flex flex-wrap gap-2"
          title={effectLocked ? t("imageBlur.modeLockedHint") : undefined}
        >
          <button
            type="button"
            disabled={effectLocked && effect !== "blur"}
            onClick={() => selectEffect("blur")}
            className={modeButtonClass(effect === "blur", effectLocked && effect !== "blur")}
          >
            {t("imageBlur.modeBlur")}
          </button>
          <button
            type="button"
            disabled={effectLocked && effect !== "solid"}
            onClick={() => selectEffect("solid")}
            className={modeButtonClass(effect === "solid", effectLocked && effect !== "solid")}
          >
            {t("imageBlur.modeSolid")}
          </button>
          <button
            type="button"
            disabled={effectLocked && effect !== "mosaic"}
            onClick={() => selectEffect("mosaic")}
            className={modeButtonClass(effect === "mosaic", effectLocked && effect !== "mosaic")}
          >
            {t("imageBlur.modeMosaic")}
          </button>
        </div>
        {effectLocked && (
          <p className="w-full text-xs text-muted-foreground md:w-auto">
            {t("imageBlur.modeLockedHint")}
          </p>
        )}
        {effect === "blur" && (
          <label className="flex items-center gap-2 text-sm">
            <span>{t("imageBlur.blurStrength")}</span>
            <input
              type="range"
              min={4}
              max={48}
              value={blurPx}
              onChange={(e) => setBlurPx(Number(e.target.value))}
              className="w-32"
            />
            <span className="tabular-nums text-muted-foreground">{blurPx}px</span>
          </label>
        )}
        {effect === "solid" && (
          <label className="flex items-center gap-2 text-sm">
            <span>{t("imageBlur.solidColor")}</span>
            <input
              type="color"
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
            />
          </label>
        )}
        {effect === "mosaic" && (
          <label className="flex items-center gap-2 text-sm">
            <span>{t("imageBlur.mosaicBlock")}</span>
            <input
              type="range"
              min={4}
              max={48}
              value={mosaicBlockPx}
              onChange={(e) => setMosaicBlockPx(Number(e.target.value))}
              className="w-32"
            />
            <span className="tabular-nums text-muted-foreground">{mosaicBlockPx}px</span>
          </label>
        )}
      </div>

      {!image && (
        <button
          type="button"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/40"
        >
          <EyeOff className="h-10 w-10 opacity-50" aria-hidden />
          <span>{t("imageBlur.dropHint")}</span>
        </button>
      )}

      {image && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("imageBlur.drawHint")}</p>
          <div
            ref={containerRef}
            className="relative inline-block max-w-full rounded-lg border border-border bg-muted/30 p-2"
          >
            <div className="relative isolate inline-block max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                data-image-blur-target
                src={image.src}
                alt=""
                onLoad={() => requestAnimationFrame(() => syncMosaicPreviewRef.current())}
                className="pointer-events-none max-h-[min(70vh,900px)] w-auto max-w-full select-none object-contain"
                draggable={false}
              />
              <canvas
                ref={mosaicCanvasRef}
                className="pointer-events-none absolute left-0 top-0"
                aria-hidden
              />
              <div
                role="presentation"
                className="absolute inset-0 cursor-crosshair touch-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {effect !== "mosaic" &&
                  regions.map((r, i) => (
                    <div
                      key={`${r.x}-${r.y}-${r.w}-${r.h}-${i}`}
                      className="pointer-events-none absolute border-2 border-primary/70"
                      style={
                        effect === "solid"
                          ? {
                              left: `${r.x * 100}%`,
                              top: `${r.y * 100}%`,
                              width: `${r.w * 100}%`,
                              height: `${r.h * 100}%`,
                              backgroundColor: solidColor,
                            }
                          : {
                              left: `${r.x * 100}%`,
                              top: `${r.y * 100}%`,
                              width: `${r.w * 100}%`,
                              height: `${r.h * 100}%`,
                              backgroundColor: "rgba(255,255,255,0.06)",
                              backdropFilter: `blur(${blurPx}px)`,
                              WebkitBackdropFilter: `blur(${blurPx}px)`,
                            }
                      }
                    />
                  ))}
                <div
                  ref={draftBoxRef}
                  className="pointer-events-none absolute hidden border-2 border-dashed border-foreground/60"
                />
              </div>
            </div>
          </div>

          {regions.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">{t("imageBlur.regions")}</span>
              <ul className="mt-2 flex flex-wrap gap-2">
                {regions.map((_, i) => (
                  <li key={i}>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeRegion(i)}>
                      {t("imageBlur.removeRegion").replace("{{n}}", String(i + 1))}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
