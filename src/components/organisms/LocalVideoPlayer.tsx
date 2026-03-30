"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { srtToVtt } from "@/lib/srt-to-vtt";
import { Clapperboard, FileVideo, Subtitles, X } from "lucide-react";

const SUBTITLE_MAX_BYTES = 2 * 1024 * 1024;

function isProbablyVtt(content: string): boolean {
  const head = content.replace(/^\uFEFF/, "").slice(0, 32).trimStart();
  return head.toUpperCase().startsWith("WEBVTT");
}

export function LocalVideoPlayer() {
  const { t } = useLanguage();
  const videoId = useId();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>("");
  const [subName, setSubName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

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
    setSubName("");
    if (subInputRef.current) subInputRef.current.value = "";
  }, []);

  const clearAll = useCallback(() => {
    clearVideo();
    clearSubtitle();
    setError(null);
  }, [clearVideo, clearSubtitle]);

  const onPickVideo = useCallback(
    (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      if (!file.type.startsWith("video/") && !/\.mp4$/i.test(file.name)) {
        setError(t("localVideo.invalidVideo"));
        return;
      }
      setError(null);
      setVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setVideoName(file.name);
    },
    [t]
  );

  const onPickSubtitle = useCallback(
    async (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".srt") && !lower.endsWith(".vtt")) {
        setError(t("localVideo.invalidSub"));
        return;
      }
      if (file.size > SUBTITLE_MAX_BYTES) {
        setError(t("localVideo.subTooLarge"));
        return;
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
        const blob = new Blob([vttBody], { type: "text/vtt;charset=utf-8" });
        setTrackUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setSubName(file.name);
      } catch {
        setError(t("localVideo.subReadError"));
      }
    },
    [t]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground leading-relaxed">
        {t("localVideo.hint")}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/*,.mp4"
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

      {videoUrl ? (
        <div className="rounded-xl border border-border bg-black/40 overflow-hidden shadow-inner">
          <video
            key={`${videoUrl}-${trackUrl ?? ""}`}
            id={videoId}
            className="w-full max-h-[min(70vh,720px)] object-contain bg-black"
            controls
            playsInline
            preload="metadata"
            src={videoUrl}
          >
            {trackUrl && (
              <track
                kind="subtitles"
                srcLang="und"
                label={subName || "Subtitles"}
                src={trackUrl}
                default
              />
            )}
          </video>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 py-16 px-4 text-center"
          aria-hidden
        >
          <Clapperboard className="size-12 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground max-w-md">{t("localVideo.emptyState")}</p>
        </div>
      )}
    </div>
  );
}
