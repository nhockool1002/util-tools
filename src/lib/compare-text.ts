import * as Diff from "diff";

export type LineType = "same" | "removed" | "added";

export interface DiffLine {
  lineNumber: number;
  text: string;
  type: LineType;
}

export interface CompareResult {
  leftLines: DiffLine[];
  rightLines: DiffLine[];
}

function normalizeForCompare(text: string, options: { ignoreWhitespace?: boolean; ignoreCase?: boolean }): string {
  let out = text;
  if (options.ignoreWhitespace) {
    out = out.split("\n").map((l) => l.trim()).join("\n");
  }
  if (options.ignoreCase) {
    out = out.toLowerCase();
  }
  return out;
}

/**
 * So sánh hai đoạn text theo dòng, trả về hai mảng line để hiển thị side-by-side.
 * Left: same + removed (removed = đỏ), Right: same + added (added = xanh).
 */
export function compareLines(
  leftText: string,
  rightText: string,
  options: { ignoreWhitespace?: boolean; ignoreCase?: boolean } = {}
): CompareResult {
  const left = options.ignoreWhitespace || options.ignoreCase
    ? normalizeForCompare(leftText, options)
    : leftText;
  const right = options.ignoreWhitespace || options.ignoreCase
    ? normalizeForCompare(rightText, options)
    : rightText;

  const changes = Diff.diffLines(left, right);
  const leftLines: DiffLine[] = [];
  const rightLines: DiffLine[] = [];
  let leftNum = 0;
  let rightNum = 0;

  for (const change of changes) {
    const lines = (change.value as string).split("\n");
    if (lines[lines.length - 1] === "") lines.pop();

    if (change.added) {
      for (const line of lines) {
        rightNum++;
        rightLines.push({ lineNumber: rightNum, text: line, type: "added" });
        leftLines.push({ lineNumber: leftNum, text: "", type: "same" });
      }
    } else if (change.removed) {
      for (const line of lines) {
        leftNum++;
        leftLines.push({ lineNumber: leftNum, text: line, type: "removed" });
        rightLines.push({ lineNumber: rightNum, text: "", type: "same" });
      }
    } else {
      for (const line of lines) {
        leftNum++;
        rightNum++;
        leftLines.push({ lineNumber: leftNum, text: line, type: "same" });
        rightLines.push({ lineNumber: rightNum, text: line, type: "same" });
      }
    }
  }

  return { leftLines, rightLines };
}
