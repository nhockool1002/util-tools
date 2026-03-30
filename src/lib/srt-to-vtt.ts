/**
 * Chuyển nội dung SRT sang WebVTT để dùng với <track> (trình duyệt không đọc SRT trực tiếp).
 * Xử lý theo block: số thứ tự (tuỳ chọn), dòng thời gian, nhiều dòng text.
 */
export function srtToVtt(srt: string): string {
  const text = srt.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (!text) return "WEBVTT\n\n";

  const blocks = text.split(/\n\s*\n/);
  const cues: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trimEnd());
    if (lines.length < 2) continue;

    let i = 0;
    if (/^\d+$/.test(lines[0].trim())) {
      i = 1;
    }

    const timeLine = lines[i];
    const timeMatch = timeLine.match(
      /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
    );
    if (!timeMatch) continue;

    const start = timeMatch[1].replace(",", ".");
    const end = timeMatch[2].replace(",", ".");
    const body = lines
      .slice(i + 1)
      .join("\n")
      .trim();
    if (!body) continue;

    cues.push(`${start} --> ${end}\n${body}`);
  }

  return `WEBVTT\n\n${cues.join("\n\n")}`;
}
