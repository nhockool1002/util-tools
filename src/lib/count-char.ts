export interface TextStats {
  characters: number;
  nonBlankCharacters: number;
  words: number;
  spaces: number;
  sentences: number;
  lines: number;
  notEmptyLines: number;
  pages: number;
}

export function getTextStats(text: string): TextStats {
  const characters = text.length;
  const nonBlankCharacters = (text.match(/\S/g) ?? []).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const spaces = (text.match(/ /g) ?? []).length;
  const sentences = (text.match(/[.!?]+(?=\s|$)/g) ?? []).length;
  const lines = text.length === 0 ? 0 : text.split(/\r?\n/).length;
  const notEmptyLines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0).length;
  const pages = Number((characters / 1500).toFixed(1));

  return {
    characters,
    nonBlankCharacters,
    words,
    spaces,
    sentences,
    lines,
    notEmptyLines,
    pages,
  };
}
