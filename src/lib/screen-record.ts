/**
 * Screen recording: getDisplayMedia constraints và MediaRecorder MIME types.
 */

export type QualityPreset = "720p" | "1080p";
export type FormatPreset = "webm" | "mp4";
export type CursorPreset = "always" | "never";
export type BitratePreset = "low" | "medium" | "high";

export const QUALITY_CONSTRAINTS: Record<
  QualityPreset,
  { width: number; height: number }
> = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
};

/** Bitrate (bps) theo preset và quality. */
export function getVideoBitrate(quality: QualityPreset, bitrate: BitratePreset): number {
  const base = quality === "1080p" ? 5_000_000 : 2_500_000;
  switch (bitrate) {
    case "low": return Math.floor(base * 0.5);
    case "high": return Math.floor(base * 1.5);
    default: return base;
  }
}

/** Video constraints cho getDisplayMedia theo chất lượng và frameRate. */
export function getVideoConstraints(
  quality: QualityPreset,
  frameRate: number = 30
): MediaTrackConstraints {
  const { width, height } = QUALITY_CONSTRAINTS[quality];
  return {
    width: { ideal: width },
    height: { ideal: height },
    frameRate: { ideal: frameRate },
  };
}

const MP4_MIMES = [
  "video/mp4;codecs=avc1.64002A,mp4a.40.2",
  "video/mp4;codecs=avc1",
  "video/mp4",
];

const WEBM_MIME = "video/webm;codecs=vp9";

/** Chọn MIME type cho MediaRecorder: ưu tiên mp4 nếu hỗ trợ, không thì webm. */
export function getMimeType(format: FormatPreset): {
  mimeType: string;
  extension: string;
  fallback: boolean;
} {
  if (format === "mp4") {
    for (const mime of MP4_MIMES) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
        return { mimeType: mime, extension: "mp4", fallback: false };
      }
    }
    return { mimeType: WEBM_MIME, extension: "webm", fallback: true };
  }
  return { mimeType: WEBM_MIME, extension: "webm", fallback: false };
}
