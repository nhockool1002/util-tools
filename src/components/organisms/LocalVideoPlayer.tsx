"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
} from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { LocalVideoSubtitlePanel } from "@/components/organisms/LocalVideoSubtitlePanel";
import { srtToVtt } from "@/lib/srt-to-vtt";
import {
  DEFAULT_SUBTITLE_STYLE,
  loadSubtitleStyle,
  positionToFlexClasses,
  sanitizeSubtitleStyle,
  saveSubtitleStyle,
  subtitleStyleToBoxStyle,
  type SubtitleStyleState,
} from "@/lib/local-video-subtitle-style";
import { findCueAt, parseWebVttCues, type VttCue } from "@/lib/webvtt-parse";
import { cn } from "@/lib/utils";
import { Clapperboard, FileVideo, Subtitles, Upload, X } from "lucide-react";

const SUBTITLE_MAX_BYTES = 2 * 1024 * 1024;

function isProbablyVtt(content: string): boolean {
  const head = content.replace(/^\uFEFF/, "").slice(0, 32).trimStart();
  return head.toUpperCase().startsWith("WEBVTT");
}

function classifyFile(file: File): "video" | "subtitle" | "unknown" {
  const n = file.name.toLowerCase();
  if (file.type.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(n)) {
    return "video";
  }
  if (n.endsWith(".srt") || n.endsWith(".vtt")) return "subtitle";
  return "unknown";
}

export function LocalVideoPlayer() {
  const { t, locale } = useLanguage();
  const videoId = useId();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragDepthRef = useRef(0);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [cues, setCues] = useState<VttCue[]>([]);
  const [activeCueText, setActiveCueText] = useState("");
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyleState>(() => loadSubtitleStyle());
  const [videoName, setVideoName] = useState<string>("");
  const [subName, setSubName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    saveSubtitleStyle(sanitizeSubtitleStyle(subtitleStyle));
  }, [subtitleStyle]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      if (trackUrl) URL.revokeObjectURL(trackUrl);
    };
  }, [trackUrl]);

  const applyVideoFile = useCallback(
    (file: File): boolean => {
      if (!file.type.startsWith("video/") && !/\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(file.name)) {
        setError(t("localVideo.invalidVideo"));
        return false;
      }
      setError(null);
      setVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setVideoName(file.name);
      if (videoInputRef.current) videoInputRef.current.value = "";
      return true;
    },
    [t]
  );

  const applySubtitleFile = useCallback(
    async (file: File): Promise<boolean> => {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".srt") && !lower.endsWith(".vtt")) {
        setError(t("localVideo.invalidSub"));
        return false;
      }
      if (file.size > SUBTITLE_MAX_BYTES) {
        setError(t("localVideo.subTooLarge"));
        return false;
      }
      setError(null);
      try {
        const raw = await file.text();
        let vttBody: string;
        if (lower.endsWith(".vtt") || isProbablyVtt(raw)) {
          vttBody = isProbablyVtt(raw) ? raw.replace(/^\uFEFF/, "") : raw;
        } else {
          vttBody = srtToVtt(raw);
        }
        const parsed = parseWebVttCues(vttBody);
        setCues(parsed);
        const blob = new Blob([vttBody], { type: "text/vtt;charset=utf-8" });
        setTrackUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setSubName(file.name);
        if (subInputRef.current) subInputRef.current.value = "";
        if (parsed.length === 0) setError(t("localVideo.subNoCues"));
        return true;
      } catch {
        setError(t("localVideo.subReadError"));
        return false;
      }
    },
    [t]
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      let videoFile: File | undefined;
      let subFile: File | undefined;
      let unknownCount = 0;

      for (const f of files) {
        const kind = classifyFile(f);
        if (kind === "video" && !videoFile) videoFile = f;
        else if (kind === "subtitle" && !subFile) subFile = f;
        else if (kind === "unknown") unknownCount++;
      }

      if (videoFile) applyVideoFile(videoFile);
      if (subFile) await applySubtitleFile(subFile);

      if (!videoFile && !subFile) {
        if (files.length === 0) return;
        if (unknownCount > 0) setError(t("localVideo.dropUnknown"));
        else setError(t("localVideo.dropNoValid"));
      }
    },
    [applySubtitleFile, applyVideoFile, t]
  );

  const clearVideo = useCallback(() => {
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setVideoName("");
    if (videoInputRef.current) videoInputRef.current.value = "";
  }, []);

  const clearSubtitle = useCallback(() => {
    setTrackUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCues([]);
    setActiveCueText("");
    setSubName("");
    if (subInputRef.current) subInputRef.current.value = "";
  }, []);

  const clearAll = useCallback(() => {
    clearVideo();
    clearSubtitle();
    setError(null);
  }, [clearVideo, clearSubtitle]);

  const resetSubtitleStyle = useCallback(() => {
    const next = sanitizeSubtitleStyle(DEFAULT_SUBTITLE_STYLE);
    setSubtitleStyle(next);
    saveSubtitleStyle(next);
  }, []);

  const onPickVideo = useCallback(
    (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      applyVideoFile(file);
    },
    [applyVideoFile]
  );

  const onPickSubtitle = useCallback(
    async (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      await applySubtitleFile(file);
    },
    [applySubtitleFile]
  );

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (dragDepthRef.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragging(false);
      void processFiles(Array.from(e.dataTransfer.files));
    },
    [processFiles]
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v || cues.length === 0) {
      setActiveCueText("");
      return;
    }

    const tick = () => {
      const cue = findCueAt(cues, v.currentTime);
      const next = cue?.text ?? "";
      setActiveCueText((prev) => (prev === next ? prev : next));
    };

    tick();
    v.addEventListener("timeupdate", tick);
    v.addEventListener("seeking", tick);
    return () => {
      v.removeEventListener("timeupdate", tick);
      v.removeEventListener("seeking", tick);
    };
  }, [cues, videoUrl]);

  /* Plyr chỉ gắn theo videoUrl + locale — không theo trackUrl (tránh destroy/init lại khi tải phụ đề). */
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoUrl) return;

    let player: Plyr | null = null;
    try {
      player = new Plyr(el, {
      iconUrl: "/plyr.svg",
      fullscreen: {
        enabled: true,
        iosNative: true,
        container: "[data-local-video-root]",
      },
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        "settings",
        "pip",
        "airplay",
        "fullscreen",
      ],
      settings: ["speed", "loop"],
      keyboard: { focused: true, global: false },
      tooltips: { controls: true, seek: true },
      ...(locale === "vi"
        ? {
            i18n: {
              play: "Phát",
              pause: "Tạm dừng",
              mute: "Tắt tiếng",
              unmute: "Bật tiếng",
              enterFullscreen: "Toàn màn hình",
              exitFullscreen: "Thoát toàn màn hình",
              settings: "Cài đặt",
              speed: "Tốc độ",
              normal: "Bình thường",
              loop: "Lặp",
              pip: "PIP",
              seek: "Tua",
              seekLabel: "{currentTime} / {duration}",
              volume: "Âm lượng",
            },
          }
        : {}),
    });
    } catch {
      return;
    }

    return () => {
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [videoUrl, locale]);

  const boxStyle = subtitleStyleToBoxStyle(subtitleStyle);
  const positionFlex = positionToFlexClasses(subtitleStyle.position);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground leading-relaxed">{t("localVideo.hint")}</p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/*,.mp4,.webm,.mov"
          className="sr-only"
          aria-label={t("localVideo.pickVideo")}
          onChange={(e) => onPickVideo(e.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
          onClick={() => videoInputRef.current?.click()}
        >
          <FileVideo className="size-4 shrink-0" aria-hidden />
          {t("localVideo.pickVideo")}
        </Button>

        <input
          ref={subInputRef}
          type="file"
          accept=".srt,.vtt,text/plain"
          className="sr-only"
          aria-label={t("localVideo.pickSub")}
          onChange={(e) => void onPickSubtitle(e.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
          onClick={() => subInputRef.current?.click()}
        >
          <Subtitles className="size-4 shrink-0" aria-hidden />
          {t("localVideo.pickSub")}
        </Button>

        {(videoUrl || trackUrl) && (
          <Button type="button" variant="outline" className="gap-2" onClick={clearAll}>
            <X className="size-4 shrink-0" aria-hidden />
            {t("localVideo.clearAll")}
          </Button>
        )}
      </div>

      {(videoName || subName) && (
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          {videoName && (
            <li>
              <span className="font-medium text-foreground">{t("localVideo.videoLabel")}</span>{" "}
              {videoName}
            </li>
          )}
          {subName && (
            <li>
              <span className="font-medium text-foreground">{t("localVideo.subLabel")}</span>{" "}
              {subName}
            </li>
          )}
        </ul>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {trackUrl && (
        <LocalVideoSubtitlePanel
          value={subtitleStyle}
          onChange={(next) => setSubtitleStyle(sanitizeSubtitleStyle(next))}
          onReset={resetSubtitleStyle}
          t={t}
        />
      )}

      <div
        className={cn(
          "relative rounded-xl transition-[box-shadow,border-color,background-color] duration-200",
          "min-h-[min(280px,50vh)]",
          videoUrl ? "border border-border bg-black/30" : "border-2 border-dashed border-border bg-muted/25",
          isDragging &&
            "border-primary border-solid ring-2 ring-primary/40 ring-offset-2 ring-offset-background bg-primary/5"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-primary/10 backdrop-blur-[1px]"
            aria-hidden
          >
            <Upload className="size-10 text-primary" />
            <span className="text-sm font-medium text-foreground">{t("localVideo.dropActive")}</span>
          </div>
        )}

        {videoUrl ? (
          <div
            className="relative w-full overflow-hidden rounded-[inherit]"
            data-local-video-root
          >
            <div className="local-video-plyr">
              <video
                ref={videoRef}
                key={videoUrl}
                id={videoId}
                className="max-h-[min(70vh,720px)] w-full object-contain"
                playsInline
                preload="metadata"
                src={videoUrl}
              />
            </div>

            {cues.length > 0 && activeCueText ? (
              <div
                className={cn(
                  "absolute inset-0 z-[18] flex flex-col pointer-events-none",
                  positionFlex
                )}
                aria-live="polite"
              >
                <div style={boxStyle}>{activeCueText}</div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[min(280px,50vh)] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <Clapperboard className="size-14 text-muted-foreground/50" aria-hidden />
            <div className="space-y-2 max-w-md">
              <p className="text-sm font-medium text-foreground">{t("localVideo.dropTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("localVideo.dropHint")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
