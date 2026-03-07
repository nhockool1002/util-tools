/**
 * Regex Tester - validate, match, replace, and build highlight segments.
 * Supports flags: g, i, m, s, u, y
 */

export type RegexFlag = "g" | "i" | "m" | "s" | "u" | "y" | "d";

export const REGEX_FLAGS: { id: RegexFlag; label: string; description: string }[] = [
  { id: "g", label: "g", description: "Global - all matches" },
  { id: "i", label: "i", description: "Ignore case" },
  { id: "m", label: "m", description: "Multiline ^ $" },
  { id: "s", label: "s", description: "Dotall . matches newline" },
  { id: "u", label: "u", description: "Unicode" },
  { id: "y", label: "y", description: "Sticky" },
  { id: "d", label: "d", description: "Indices (group positions)" },
];

export interface RegexValidateResult {
  valid: boolean;
  error?: string;
  regex?: RegExp;
}

export function validateRegex(pattern: string, flags: RegexFlag[]): RegexValidateResult {
  if (!pattern.trim()) {
    return { valid: false, error: "Pattern is empty" };
  }
  const flagsStr = [...new Set(flags)].join("");
  try {
    const regex = new RegExp(pattern, flagsStr);
    return { valid: true, regex };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { valid: false, error: msg };
  }
}

export interface RegexMatchItem {
  index: number;
  fullMatch: string;
  groups: (string | undefined)[];
  groupIndices: { start: number; end: number }[];
}

export interface RegexMatchResult {
  success: boolean;
  matches: RegexMatchItem[];
  error?: string;
}

function buildFlagsString(flags: RegexFlag[]): string {
  return [...new Set(flags)].join("");
}

export function getRegexMatches(
  pattern: string,
  testString: string,
  flags: RegexFlag[]
): RegexMatchResult {
  const validated = validateRegex(pattern, flags);
  if (!validated.valid) {
    return { success: false, matches: [], error: validated.error };
  }
  const regex = validated.regex!;
  const mustClone = regex.global; // exec mutates lastIndex
  const re = mustClone ? new RegExp(regex.source, regex.flags) : regex;
  const matches: RegexMatchItem[] = [];
  let m: RegExpExecArray | null;
  const hasIndices = "hasIndices" in re && (re as RegExp & { hasIndices?: boolean }).hasIndices;

  while ((m = re.exec(testString)) !== null) {
    const groups: (string | undefined)[] = [];
    const groupIndices: { start: number; end: number }[] = [];
    for (let i = 1; i < m.length; i++) {
      groups.push(m[i]);
      if (m.indices) {
        const [start, end] = m.indices[i] ?? [m.index, m.index];
        groupIndices.push({ start, end });
      } else {
        const gr = m[i];
        const start = gr !== undefined ? m.index + m[0].indexOf(gr) : m.index;
        const end = gr !== undefined ? start + gr.length : m.index;
        groupIndices.push({ start, end });
      }
    }
    matches.push({
      index: m.index,
      fullMatch: m[0],
      groups,
      groupIndices,
    });
    if (!regex.global) break;
  }

  return { success: true, matches };
}

export interface HighlightSegment {
  type: "text" | "fullMatch" | "group";
  content: string;
  groupIndex?: number; // 0 = full match, 1,2,... = capture groups
}

const FULL_MATCH_COLOR = "rgba(34, 197, 94, 0.35)"; // green
const GROUP_COLORS = [
  "rgba(59, 130, 246, 0.4)",
  "rgba(168, 85, 247, 0.4)",
  "rgba(236, 72, 153, 0.4)",
  "rgba(245, 158, 11, 0.4)",
  "rgba(20, 184, 166, 0.4)",
];

function getGroupColor(groupIndex: number): string {
  return GROUP_COLORS[groupIndex % GROUP_COLORS.length];
}

/**
 * Build non-overlapping segments for highlighting.
 * Priority: capture groups (inner) then full match (outer), then text.
 * Each character is assigned the highest-priority type (group > fullMatch > text).
 */
export function getHighlightSegments(
  testString: string,
  matches: RegexMatchItem[]
): HighlightSegment[] {
  if (matches.length === 0) {
    return [{ type: "text", content: testString }];
  }

  const len = testString.length;
  type CharType = "text" | "fullMatch" | "group";
  const charTypes: { type: CharType; groupIndex?: number }[] = Array.from({ length: len }, () => ({ type: "text" }));

  for (const m of matches) {
    const fullStart = m.index;
    const fullEnd = m.index + m.fullMatch.length;
    for (let i = fullStart; i < fullEnd && i < len; i++) {
      charTypes[i] = { type: "fullMatch" };
    }
    for (let g = 0; g < m.groupIndices.length; g++) {
      const { start, end } = m.groupIndices[g];
      for (let i = start; i < end && i < len; i++) {
        charTypes[i] = { type: "group", groupIndex: g + 1 };
      }
    }
  }

  const segments: HighlightSegment[] = [];
  let i = 0;
  while (i < len) {
    const current = charTypes[i];
    let j = i + 1;
    while (j < len && charTypes[j].type === current.type && charTypes[j].groupIndex === current.groupIndex) {
      j++;
    }
    const content = testString.slice(i, j);
    if (current.type === "text") {
      segments.push({ type: "text", content });
    } else if (current.type === "group" && current.groupIndex != null) {
      segments.push({ type: "group", content, groupIndex: current.groupIndex });
    } else {
      segments.push({ type: "fullMatch", content });
    }
    i = j;
  }
  return segments;
}

export function getSegmentColor(segment: HighlightSegment): string | undefined {
  if (segment.type === "fullMatch") return FULL_MATCH_COLOR;
  if (segment.type === "group" && segment.groupIndex != null) {
    return getGroupColor(segment.groupIndex - 1);
  }
  return undefined;
}

export interface ReplaceResult {
  success: boolean;
  result: string;
  count?: number;
  error?: string;
}

export function replaceAll(
  pattern: string,
  testString: string,
  replacement: string,
  flags: RegexFlag[]
): ReplaceResult {
  const validated = validateRegex(pattern, flags);
  if (!validated.valid) {
    return { success: false, result: testString, error: validated.error };
  }
  const re = validated.regex!;
  const flagsStr = re.flags;
  if (!flagsStr.includes("g")) {
    const globalRe = new RegExp(re.source, re.flags + "g");
    try {
      const result = testString.replace(globalRe, replacement);
      const count = (testString.match(globalRe) || []).length;
      return { success: true, result, count };
    } catch (e) {
      return {
        success: false,
        result: testString,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
  try {
    const matchCount = (testString.match(re) || []).length;
    const result = testString.replace(re, replacement);
    return { success: true, result, count: matchCount };
  } catch (e) {
    return {
      success: false,
      result: testString,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Suggestions for regex syntax - filter by prefix */
export interface RegexSuggestion {
  insert: string;
  label: string;
  description?: string;
}

export const REGEX_SUGGESTIONS: RegexSuggestion[] = [
  { insert: "\\d", label: "\\d", description: "Digit [0-9]" },
  { insert: "\\d+", label: "\\d+", description: "One or more digits" },
  { insert: "\\D", label: "\\D", description: "Non-digit" },
  { insert: "\\w", label: "\\w", description: "Word char [a-zA-Z0-9_]" },
  { insert: "\\w+", label: "\\w+", description: "One or more word chars" },
  { insert: "\\W", label: "\\W", description: "Non-word char" },
  { insert: "\\s", label: "\\s", description: "Whitespace" },
  { insert: "\\s+", label: "\\s+", description: "One or more whitespace" },
  { insert: "\\S", label: "\\S", description: "Non-whitespace" },
  { insert: "\\b", label: "\\b", description: "Word boundary" },
  { insert: "\\B", label: "\\B", description: "Non-word boundary" },
  { insert: ".", label: ".", description: "Any char (except newline)" },
  { insert: ".*", label: ".*", description: "Any chars (greedy)" },
  { insert: ".*?", label: ".*?", description: "Any chars (lazy)" },
  { insert: "[a-z]", label: "[a-z]", description: "Lowercase letter" },
  { insert: "[A-Z]", label: "[A-Z]", description: "Uppercase letter" },
  { insert: "[0-9]", label: "[0-9]", description: "Digit" },
  { insert: "[^x]", label: "[^x]", description: "Negated class" },
  { insert: "( group )", label: "( )", description: "Capture group" },
  { insert: "(?: )", label: "(?: )", description: "Non-capture group" },
  { insert: "\\1", label: "\\1", description: "Backreference group 1" },
  { insert: "^", label: "^", description: "Start of line/string" },
  { insert: "$", label: "$", description: "End of line/string" },
  { insert: "\\n", label: "\\n", description: "Newline" },
  { insert: "\\t", label: "\\t", description: "Tab" },
  { insert: "+", label: "+", description: "One or more" },
  { insert: "*", label: "*", description: "Zero or more" },
  { insert: "?", label: "?", description: "Zero or one" },
  { insert: "{n}", label: "{n}", description: "Exactly n" },
  { insert: "{n,}", label: "{n,}", description: "n or more" },
  { insert: "{n,m}", label: "{n,m}", description: "Between n and m" },
  { insert: "(?= )", label: "(?= )", description: "Lookahead" },
  { insert: "(?! )", label: "(?! )", description: "Negative lookahead" },
];

export function filterSuggestions(query: string, limit = 12): RegexSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return REGEX_SUGGESTIONS.slice(0, limit);
  const filtered = REGEX_SUGGESTIONS.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      (s.description?.toLowerCase().includes(q))
  );
  return filtered.slice(0, limit);
}
