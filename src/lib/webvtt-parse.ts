export interface VttCue {
  start: number;
  end: number;
  text: string;
}

/** Chuyển chuỗi thời gian WebVTT (00:00:00.000 hoặc 00:00.000) sang giây */
export function parseVttTimestamp(s: string): number {
  const normalized = s.replace(",", ".").trim();
  const parts = normalized.split(":");
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const sec = parseFloat(parts[2]) || 0;
    return h * 3600 + m * 60 + sec;
  }
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const sec = parseFloat(parts[1]) || 0;
    return m * 60 + sec;
  }
  return 0;
}

/** Tách dòng thời gian cue: "start --> end settings..." */
function splitCueTimes(timeLine: string): { start: string; end: string } | null {
  const arrow = "-->";
  const idx = timeLine.indexOf(arrow);
  if (idx === -1) return null;
  const start = timeLine.slice(0, idx).trim();
  const rest = timeLine.slice(idx + arrow.length).trim();
  const end = rest.split(/\s+/)[0] ?? "";
  if (!start || !end) return null;
  return { start, end };
}

/**
 * Parse nội dung WebVTT thành danh sách cue (bỏ qua NOTE / STYLE block đơn giản).
 */
export function parseWebVttCues(vtt: string): VttCue[] {
  const text = vtt.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  let i = 0;

  if (lines[i]?.startsWith("WEBVTT")) {
    i++;
    while (i < lines.length && lines[i].trim() !== "") i++;
    if (lines[i]?.trim() === "") i++;
  }

  const cues: VttCue[] = [];

  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;

    if (lines[i].startsWith("NOTE") || lines[i].startsWith("STYLE") || lines[i].startsWith("REGION")) {
      while (i < lines.length && lines[i].trim() !== "") i++;
      continue;
    }

    if (/^\d+$/.test(lines[i].trim())) {
      i++;
    }

    const timeLine = lines[i];
    if (!timeLine) {
      i++;
      continue;
    }

    const times = splitCueTimes(timeLine);
    if (!times) {
      i++;
      continue;
    }

    const start = parseVttTimestamp(times.start);
    const end = parseVttTimestamp(times.end);
    i++;

    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i]);
      i++;
    }

    const cueText = textLines.join("\n").trim();
    if (cueText) {
      cues.push({ start, end, text: cueText });
    }
  }

  cues.sort((a, b) => a.start - b.start);
  return cues;
}

export function findCueAt(cues: VttCue[], timeSec: number): VttCue | undefined {
  for (const c of cues) {
    if (timeSec >= c.start && timeSec < c.end) return c;
  }
  return undefined;
}
