function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface HighlightMatch {
  start: number;
  end: number;
  color: string;
}

export interface HighlightSegment {
  type: "text" | "highlight";
  content: string;
  color?: string;
}

export interface KeywordHighlight {
  text: string;
  color: string;
}

/**
 * Tìm tất cả vị trí match của từng keyword (case-insensitive).
 * Trả về danh sách (start, end, color), sắp xếp theo start rồi theo độ dài giảm (longest first).
 */
function findAllMatches(content: string, keywords: KeywordHighlight[]): HighlightMatch[] {
  const matches: HighlightMatch[] = [];
  const lowerContent = content.toLowerCase();

  for (const { text, color } of keywords) {
    if (!text.trim()) continue;
    const escaped = escapeRegex(text);
    const regex = new RegExp(escaped, "gi");
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, color });
    }
  }

  matches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - b.start - (a.end - a.start);
  });
  return matches;
}

/**
 * Chọn các match không giao nhau, ưu tiên match dài hơn (greedy).
 */
function resolveOverlaps(matches: HighlightMatch[]): HighlightMatch[] {
  const result: HighlightMatch[] = [];
  let currentEnd = 0;
  for (const m of matches) {
    if (m.start >= currentEnd) {
      result.push(m);
      currentEnd = m.end;
    }
  }
  return result.sort((a, b) => a.start - b.start);
}

/**
 * Chuyển content + danh sách match thành các segment (text | highlight).
 */
function matchesToSegments(content: string, resolved: HighlightMatch[]): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  let lastEnd = 0;

  for (const { start, end, color } of resolved) {
    if (start > lastEnd) {
      segments.push({ type: "text", content: content.slice(lastEnd, start) });
    }
    segments.push({ type: "highlight", content: content.slice(start, end), color });
    lastEnd = end;
  }
  if (lastEnd < content.length) {
    segments.push({ type: "text", content: content.slice(lastEnd) });
  }
  return segments;
}

export function getHighlightSegments(
  content: string,
  keywords: KeywordHighlight[]
): HighlightSegment[] {
  if (keywords.length === 0 || !content) {
    return [{ type: "text", content }];
  }
  const matches = findAllMatches(content, keywords);
  const resolved = resolveOverlaps(matches);
  return matchesToSegments(content, resolved);
}
