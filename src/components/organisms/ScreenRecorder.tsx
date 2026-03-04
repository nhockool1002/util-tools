"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Circle, Video, Volume2 } from "lucide-react";
import {
  getVideoConstraints,
  getVideoBitrate,
  getMimeType,
  type QualityPreset,
  type FormatPreset,
  type CursorPreset,
  type BitratePreset,
} from "@/lib/screen-record";

export type AudioSource = "system" | "mic" | "both" | "none";

export interface RecordingHistoryItem {
  id: string;
  url: string;
  filename: string;
  createdAt: number;
}

const COUNTDOWN_OPTIONS = [0, 3, 5, 10] as const;
const FRAME_RATE_OPTIONS = [24, 30, 60];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ScreenRecorder() {
  const { t } = useLanguage();
  const [quality, setQuality] = useState<QualityPreset>("1080p");
  const [format, setFormat] = useState<FormatPreset>("webm");
  const [audioSource, setAudioSource] = useState<AudioSource>("both");
  const [cursor, setCursor] = useState<CursorPreset>("always");
  const [highlightClicks, setHighlightClicks] = useState(false);
  const [bitrate, setBitrate] = useState<BitratePreset>("medium");
  const [frameRate, setFrameRate] = useState(30);
  const [countdown, setCountdown] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RecordingHistoryItem[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clickOverlayRef = useRef<HTMLDivElement | null>(null);
  const lastCmdRRef = useRef<number>(0);
  const DOUBLE_R_MS = 500;

  const startRecording = useCallback(async () => {
    setError(null);
    setDownloadUrl(null);
    setFallbackNotice(false);
    chunksRef.current = [];
    setElapsedSeconds(0);

    const constraints = getVideoConstraints(quality, frameRate);
    const wantDisplayAudio = audioSource === "system" || audioSource === "both";
    const wantMic = audioSource === "mic" || audioSource === "both";

    try {
      const displayOpts = {
        video: constraints,
        audio: wantDisplayAudio,
        cursor,
      };
      const displayStream = await navigator.mediaDevices.getDisplayMedia(
        displayOpts as DisplayMediaStreamOptions
      );
      let stream: MediaStream = displayStream;

      if (wantMic) {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const videoTracks = displayStream.getVideoTracks();
        const audioTracks = [...displayStream.getAudioTracks(), ...micStream.getAudioTracks()];
        stream = new MediaStream([...videoTracks, ...audioTracks]);
      }

      streamRef.current = stream;

      const { mimeType, fallback } = getMimeType(format);
      if (fallback) setFallbackNotice(true);

      const bitsPerSecond = getVideoBitrate(quality, bitrate);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "video/webm",
        videoBitsPerSecond: bitsPerSecond,
        audioBitsPerSecond: 128000,
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        const ext = recorder.mimeType.includes("mp4") ? "mp4" : "webm";
        const filename = `recording-${Date.now()}.${ext}`;
        setDownloadUrl(url);
        setDownloadFilename(filename);
        setHistory((prev) => [
          ...prev,
          { id: crypto.randomUUID(), url, filename, createdAt: Date.now() },
        ]);
      };

      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  }, [quality, format, audioSource, cursor, bitrate, frameRate]);

  const handleStart = useCallback(() => {
    if (countdown > 0) {
      setCountdownRemaining(countdown);
      const id = setInterval(() => {
        setCountdownRemaining((r) => {
          if (r <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = null;
            startRecording();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
      countdownRef.current = id;
    } else {
      startRecording();
    }
  }, [countdown, startRecording]);

  const handleStop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePause = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
    }
  }, []);

  const handleResume = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
    }
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        const now = Date.now();
        if (now - lastCmdRRef.current <= DOUBLE_R_MS) {
          lastCmdRRef.current = 0;
          if (isRecording) handleStop();
          else handleStart();
        } else {
          lastCmdRRef.current = now;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRecording, handleStart, handleStop]);

  const handleDownload = useCallback((url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }, []);

  const handleClearResult = useCallback(() => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setDownloadFilename("");
    setFallbackNotice(false);
  }, [downloadUrl]);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const handleClickOverlay = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!clickOverlayRef.current || !highlightClicks) return;
    const rect = clickOverlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement("div");
    ripple.className = "screen-recorder-ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    clickOverlayRef.current.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, [highlightClicks]);

  const selectClass =
    "w-full rounded-xl border border-input bg-background/80 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card hover:border-primary/30 hover:bg-background";

  return (
    <div className="flex flex-col gap-8">
      {isRecording && (
        <div
          className="fixed right-6 top-6 z-50 flex items-center gap-2.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-900/30 ring-1 ring-red-500/20"
          aria-live="polite"
        >
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
          {t("screenRecord.recBadge")}
          {isPaused && ` (${t("screenRecord.paused")})`}
        </div>
      )}

      {countdownRemaining > 0 && (
        <div className="flex justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 py-6 text-3xl font-bold text-amber-600 dark:text-amber-400 shadow-inner">
          {countdownRemaining}
        </div>
      )}

      {/* Video settings */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Video className="size-4 text-primary" aria-hidden />
          Video
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              {t("screenRecord.quality")}
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as QualityPreset)}
              disabled={isRecording}
              className={selectClass}
            >
              <option value="720p">720p (1280×720)</option>
              <option value="1080p">1080p (1920×1080)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              {t("screenRecord.format")}
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as FormatPreset)}
              disabled={isRecording}
              className={selectClass}
            >
              <option value="webm">WebM</option>
              <option value="mp4">MP4</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              {t("screenRecord.bitrate")}
            </label>
            <select
              value={bitrate}
              onChange={(e) => setBitrate(e.target.value as BitratePreset)}
              disabled={isRecording}
              className={selectClass}
            >
              <option value="low">{t("screenRecord.bitrateLow")}</option>
              <option value="medium">{t("screenRecord.bitrateMedium")}</option>
              <option value="high">{t("screenRecord.bitrateHigh")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              {t("screenRecord.frameRate")}
            </label>
            <select
              value={frameRate}
              onChange={(e) => setFrameRate(Number(e.target.value))}
              disabled={isRecording}
              className={selectClass}
            >
              {FRAME_RATE_OPTIONS.map((f) => (
                <option key={f} value={f}>{f} fps</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audio & display */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Volume2 className="size-4 text-primary" aria-hidden />
          Audio & display
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              {t("screenRecord.audioSource")}
            </label>
            <select
              value={audioSource}
              onChange={(e) => setAudioSource(e.target.value as AudioSource)}
              disabled={isRecording}
              className={selectClass}
            >
              <option value="system">{t("screenRecord.audioSystem")}</option>
              <option value="mic">{t("screenRecord.audioMic")}</option>
              <option value="both">{t("screenRecord.audioBoth")}</option>
              <option value="none">{t("screenRecord.audioNone")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              {t("screenRecord.cursor")}
            </label>
            <select
              value={cursor}
              onChange={(e) => setCursor(e.target.value as CursorPreset)}
              disabled={isRecording}
              className={selectClass}
            >
              <option value="always">{t("screenRecord.cursorShow")}</option>
              <option value="never">{t("screenRecord.cursorHide")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              {t("screenRecord.countdown")}
            </label>
            <select
              value={countdown}
              onChange={(e) => setCountdown(Number(e.target.value))}
              disabled={isRecording}
              className={selectClass}
            >
              {COUNTDOWN_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? t("screenRecord.countdownOff") : `${n} ${t("screenRecord.seconds")}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-background/80 px-4 py-2.5 hover:border-primary/30 hover:bg-background transition-colors has-[:disabled]:opacity-60 w-full min-h-[42px] items-center">
              <input
                type="checkbox"
                checked={highlightClicks}
                onChange={(e) => setHighlightClicks(e.target.checked)}
                disabled={isRecording}
                className="h-4 w-4 rounded-md border-input accent-primary"
              />
              <span className="text-sm font-medium text-foreground">{t("screenRecord.highlightClicks")}</span>
            </label>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-50 flex flex-wrap items-center gap-3 border-t border-border pt-6">
        {!isRecording ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={countdownRemaining > 0}
            className="screen-recorder-cta inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg hover:shadow-xl hover:from-primary hover:to-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
          >
            <Circle className="size-5 fill-current" aria-hidden />
            {t("screenRecord.start")}
          </button>
        ) : (
          <>
            <Button type="button" variant="destructive" onClick={handleStop}>
              {t("screenRecord.stop")}
            </Button>
            {typeof MediaRecorder !== "undefined" && (
              isPaused ? (
                <Button type="button" variant="outline" onClick={handleResume}>
                  {t("screenRecord.resume")}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handlePause}>
                  {t("screenRecord.pause")}
                </Button>
              )
            )}
          </>
        )}
        {downloadUrl && (
          <>
            <Button type="button" variant="outline" onClick={() => handleDownload(downloadUrl, downloadFilename)}>
              {t("screenRecord.download")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleClearResult}>
              {t("screenRecord.clearResult")}
            </Button>
          </>
        )}
      </div>

      {isRecording && (
        <p className="text-sm font-medium text-foreground rounded-xl bg-muted/50 px-4 py-2 inline-flex w-fit">
          {t("screenRecord.elapsed")}: {formatDuration(elapsedSeconds)}
        </p>
      )}

      {t("screenRecord.shortcutHint") && (
        <p className="text-xs text-muted-foreground rounded-xl bg-muted/30 px-4 py-2.5 border border-border/50">
          {t("screenRecord.shortcutHint")}
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {fallbackNotice && (
        <p className="text-sm text-muted-foreground rounded-xl bg-muted/30 px-4 py-2.5">
          {t("screenRecord.fallbackNotice")}
        </p>
      )}

      {downloadUrl && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            {t("screenRecord.preview")}
          </label>
          <video
            src={downloadUrl}
            controls
            className="max-h-[320px] w-full rounded-xl border border-border bg-black shadow-inner"
            preload="metadata"
          />
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            {t("screenRecord.history")} ({history.length})
          </h4>
          <ul className="space-y-2">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm shadow-sm"
              >
                <span className="font-mono text-muted-foreground">{item.filename}</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(item.url, item.filename)}
                  >
                    {t("screenRecord.download")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromHistory(item.id)}
                  >
                    {t("screenRecord.delete")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {highlightClicks && isRecording && (
        <div
          ref={clickOverlayRef}
          className="fixed inset-0 z-40 cursor-crosshair"
          onClick={handleClickOverlay}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={t("screenRecord.clickOverlay")}
        />
      )}
    </div>
  );
}
