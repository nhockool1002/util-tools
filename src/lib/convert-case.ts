export type ConvertCaseTransformId =
  | "uppercase"
  | "lowercase"
  | "title"
  | "sentence"
  | "swap"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "reverse"
  | "reverseWords"
  | "upsideDown"
  | "removeDiacritics"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "space"
  | "trim"
  | "normalizeSpaces"
  | "trimLines"
  | "removeEmptyLines"
  | "sortLinesAsc"
  | "sortLinesDesc"
  | "uniqueLines";

export interface ConvertCaseTransform {
  id: ConvertCaseTransformId;
  labelKey: string;
  apply: (input: string, options: ConvertCaseTransformOptions) => string;
}

export interface ConvertCaseTransformOptions {
  locale: string;
}

const STRIKE_OVERLAY = "\u0336";
const UNDERLINE_OVERLAY = "\u0332";

function toBoldText(input: string): string {
  const out: string[] = [];
  for (const char of input) {
    const code = char.codePointAt(0);
    if (code == null) {
      out.push(char);
      continue;
    }

    // Mathematical Bold: A-Z (1D400), a-z (1D41A), 0-9 (1D7CE)
    if (code >= 0x41 && code <= 0x5a) {
      out.push(String.fromCodePoint(0x1d400 + (code - 0x41)));
      continue;
    }
    if (code >= 0x61 && code <= 0x7a) {
      out.push(String.fromCodePoint(0x1d41a + (code - 0x61)));
      continue;
    }
    if (code >= 0x30 && code <= 0x39) {
      out.push(String.fromCodePoint(0x1d7ce + (code - 0x30)));
      continue;
    }

    out.push(char);
  }
  return out.join("");
}

function toItalicText(input: string): string {
  const out: string[] = [];
  for (const char of input) {
    const code = char.codePointAt(0);
    if (code == null) {
      out.push(char);
      continue;
    }

    // Mathematical Italic: A-Z (1D434), a-z (1D44E)
    if (code >= 0x41 && code <= 0x5a) {
      out.push(String.fromCodePoint(0x1d434 + (code - 0x41)));
      continue;
    }
    if (code >= 0x61 && code <= 0x7a) {
      out.push(String.fromCodePoint(0x1d44e + (code - 0x61)));
      continue;
    }

    out.push(char);
  }
  return out.join("");
}

function toUnderlineText(input: string): string {
  return [...input]
    .map((char) => {
      if (char === "\n" || char === "\r") return char;
      if (char.trim().length === 0) return char;
      return `${char}${UNDERLINE_OVERLAY}`;
    })
    .join("");
}

function toStrikeText(input: string): string {
  return [...input]
    .map((char) => {
      if (char === "\n" || char === "\r") return char;
      if (char.trim().length === 0) return char;
      return `${char}${STRIKE_OVERLAY}`;
    })
    .join("");
}

function reverseText(input: string): string {
  return [...input].reverse().join("");
}

function reverseWords(input: string): string {
  const parts = input.split(/(\s+)/);
  const words = parts.filter((p, i) => i % 2 === 0);
  const seps = parts.filter((_, i) => i % 2 === 1);
  const reversedWords = words.reverse();
  const out: string[] = [];
  for (let i = 0; i < reversedWords.length; i++) {
    out.push(reversedWords[i] ?? "");
    out.push(seps[i] ?? "");
  }
  return out.join("");
}

function removeDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .normalize("NFC");
}

const UPSIDE_DOWN_MAP: Record<string, string> = {
  a: "ɐ",
  b: "q",
  c: "ɔ",
  d: "p",
  e: "ǝ",
  f: "ɟ",
  g: "ƃ",
  h: "ɥ",
  i: "ᴉ",
  j: "ɾ",
  k: "ʞ",
  l: "ן",
  m: "ɯ",
  n: "u",
  o: "o",
  p: "d",
  q: "b",
  r: "ɹ",
  s: "s",
  t: "ʇ",
  u: "n",
  v: "ʌ",
  w: "ʍ",
  x: "x",
  y: "ʎ",
  z: "z",
  A: "∀",
  B: "𐐒",
  C: "Ɔ",
  D: "p",
  E: "Ǝ",
  F: "Ⅎ",
  G: "פ",
  H: "H",
  I: "I",
  J: "ſ",
  K: "ʞ",
  L: "˥",
  M: "W",
  N: "N",
  O: "O",
  P: "Ԁ",
  Q: "Ό",
  R: "ɹ",
  S: "S",
  T: "┴",
  U: "∩",
  V: "Λ",
  W: "M",
  X: "X",
  Y: "⅄",
  Z: "Z",
  "0": "0",
  "1": "Ɩ",
  "2": "ᄅ",
  "3": "Ɛ",
  "4": "ㄣ",
  "5": "ϛ",
  "6": "9",
  "7": "ㄥ",
  "8": "8",
  "9": "6",
  ".": "˙",
  ",": "'",
  "'": ",",
  "\"": ",,",
  "`": ",",
  "!": "¡",
  "?": "¿",
  "[": "]",
  "]": "[",
  "(": ")",
  ")": "(",
  "{": "}",
  "}": "{",
  "<": ">",
  ">": "<",
  "_": "‾",
  "&": "⅋",
};

function toUpsideDownText(input: string): string {
  const flipped = [...input]
    .map((char) => UPSIDE_DOWN_MAP[char] ?? char)
    .reverse()
    .join("");
  return flipped;
}

function isUppercaseLetter(char: string) {
  return char.toLocaleUpperCase() === char && char.toLocaleLowerCase() !== char;
}

function isLowercaseLetter(char: string) {
  return char.toLocaleLowerCase() === char && char.toLocaleUpperCase() !== char;
}

function splitCamelTokenToWords(token: string): string[] {
  if (!token) return [];
  const words: string[] = [];
  let current = "";

  for (let index = 0; index < token.length; index++) {
    const char = token[index];
    const prev = index > 0 ? token[index - 1] : "";
    const next = index + 1 < token.length ? token[index + 1] : "";

    const boundaryBeforeChar =
      current.length > 0 &&
      isUppercaseLetter(char) &&
      (isLowercaseLetter(prev) || (isUppercaseLetter(prev) && isLowercaseLetter(next)));

    if (boundaryBeforeChar) {
      words.push(current);
      current = char;
      continue;
    }

    current += char;
  }

  if (current) words.push(current);
  return words;
}

function splitToWords(input: string): string[] {
  const normalized = input
    .replace(/[./\\:_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return [];

  const roughTokens = normalized.split(" ");
  const words = roughTokens.flatMap((token) => splitCamelTokenToWords(token));

  return words.filter(Boolean);
}

function capitalizeFirstLetter(word: string, locale: string): string {
  if (!word) return word;
  const firstChar = word[0].toLocaleUpperCase(locale);
  const rest = word.slice(1).toLocaleLowerCase(locale);
  return `${firstChar}${rest}`;
}

function toSentenceCase(input: string, locale: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const firstChar = trimmed[0].toLocaleUpperCase(locale);
  const rest = trimmed.slice(1);
  return `${firstChar}${rest}`;
}

function toSwapCase(input: string, locale: string): string {
  return [...input]
    .map((char) => {
      const upper = char.toLocaleUpperCase(locale);
      const lower = char.toLocaleLowerCase(locale);
      if (char === upper && char !== lower) return lower;
      if (char === lower && char !== upper) return upper;
      return char;
    })
    .join("");
}

function toDelimitedCase(input: string, delimiter: string, locale: string, upper: boolean) {
  const words = splitToWords(input);
  if (words.length === 0) return "";
  const normalizedWords = words.map((word) =>
    upper ? word.toLocaleUpperCase(locale) : word.toLocaleLowerCase(locale)
  );
  return normalizedWords.join(delimiter);
}

function toCamelLikeCase(input: string, locale: string, upperFirst: boolean): string {
  const words = splitToWords(input);
  if (words.length === 0) return "";

  return words
    .map((word, index) => {
      const isFirst = index === 0;
      if (isFirst && !upperFirst) return word.toLocaleLowerCase(locale);
      return capitalizeFirstLetter(word, locale);
    })
    .join("");
}

function trimLines(input: string): string {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join("\n");
}

function removeEmptyLines(input: string): string {
  return input
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

function uniqueLines(input: string): string {
  const seen = new Set<string>();
  const lines = input.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out.join("\n");
}

function sortLinesAsc(input: string, locale: string): string {
  return input
    .split(/\r?\n/)
    .slice()
    .sort((a, b) => a.localeCompare(b, locale))
    .join("\n");
}

function sortLinesDesc(input: string, locale: string): string {
  return input
    .split(/\r?\n/)
    .slice()
    .sort((a, b) => b.localeCompare(a, locale))
    .join("\n");
}

export const CONVERT_CASE_TRANSFORMS: ConvertCaseTransform[] = [
  {
    id: "uppercase",
    labelKey: "convertCase.transforms.uppercase",
    apply: (input, { locale }) => input.toLocaleUpperCase(locale),
  },
  {
    id: "lowercase",
    labelKey: "convertCase.transforms.lowercase",
    apply: (input, { locale }) => input.toLocaleLowerCase(locale),
  },
  {
    id: "title",
    labelKey: "convertCase.transforms.title",
    apply: (input, { locale }) => {
      const words = splitToWords(input);
      return words.map((w) => capitalizeFirstLetter(w, locale)).join(" ");
    },
  },
  {
    id: "sentence",
    labelKey: "convertCase.transforms.sentence",
    apply: (input, { locale }) => toSentenceCase(input, locale),
  },
  {
    id: "swap",
    labelKey: "convertCase.transforms.swap",
    apply: (input, { locale }) => toSwapCase(input, locale),
  },
  {
    id: "bold",
    labelKey: "convertCase.transforms.bold",
    apply: (input) => toBoldText(input),
  },
  {
    id: "italic",
    labelKey: "convertCase.transforms.italic",
    apply: (input) => toItalicText(input),
  },
  {
    id: "underline",
    labelKey: "convertCase.transforms.underline",
    apply: (input) => toUnderlineText(input),
  },
  {
    id: "strike",
    labelKey: "convertCase.transforms.strike",
    apply: (input) => toStrikeText(input),
  },
  {
    id: "reverse",
    labelKey: "convertCase.transforms.reverse",
    apply: (input) => reverseText(input),
  },
  {
    id: "reverseWords",
    labelKey: "convertCase.transforms.reverseWords",
    apply: (input) => reverseWords(input),
  },
  {
    id: "upsideDown",
    labelKey: "convertCase.transforms.upsideDown",
    apply: (input) => toUpsideDownText(input),
  },
  {
    id: "removeDiacritics",
    labelKey: "convertCase.transforms.removeDiacritics",
    apply: (input) => removeDiacritics(input),
  },
  {
    id: "camel",
    labelKey: "convertCase.transforms.camel",
    apply: (input, { locale }) => toCamelLikeCase(input, locale, false),
  },
  {
    id: "pascal",
    labelKey: "convertCase.transforms.pascal",
    apply: (input, { locale }) => toCamelLikeCase(input, locale, true),
  },
  {
    id: "snake",
    labelKey: "convertCase.transforms.snake",
    apply: (input, { locale }) => toDelimitedCase(input, "_", locale, false),
  },
  {
    id: "kebab",
    labelKey: "convertCase.transforms.kebab",
    apply: (input, { locale }) => toDelimitedCase(input, "-", locale, false),
  },
  {
    id: "constant",
    labelKey: "convertCase.transforms.constant",
    apply: (input, { locale }) => toDelimitedCase(input, "_", locale, true),
  },
  {
    id: "dot",
    labelKey: "convertCase.transforms.dot",
    apply: (input, { locale }) => toDelimitedCase(input, ".", locale, false),
  },
  {
    id: "space",
    labelKey: "convertCase.transforms.space",
    apply: (input) => {
      const words = splitToWords(input);
      return words.join(" ");
    },
  },
  {
    id: "trim",
    labelKey: "convertCase.transforms.trim",
    apply: (input) => input.trim(),
  },
  {
    id: "normalizeSpaces",
    labelKey: "convertCase.transforms.normalizeSpaces",
    apply: (input) => input.trim().replace(/\s+/g, " "),
  },
  {
    id: "trimLines",
    labelKey: "convertCase.transforms.trimLines",
    apply: (input) => trimLines(input),
  },
  {
    id: "removeEmptyLines",
    labelKey: "convertCase.transforms.removeEmptyLines",
    apply: (input) => removeEmptyLines(input),
  },
  {
    id: "sortLinesAsc",
    labelKey: "convertCase.transforms.sortLinesAsc",
    apply: (input, { locale }) => sortLinesAsc(input, locale),
  },
  {
    id: "sortLinesDesc",
    labelKey: "convertCase.transforms.sortLinesDesc",
    apply: (input, { locale }) => sortLinesDesc(input, locale),
  },
  {
    id: "uniqueLines",
    labelKey: "convertCase.transforms.uniqueLines",
    apply: (input) => uniqueLines(input),
  },
];

export function applyTransformById(
  input: string,
  transformId: ConvertCaseTransformId,
  options: ConvertCaseTransformOptions
): string {
  const transform = CONVERT_CASE_TRANSFORMS.find((t) => t.id === transformId);
  return transform ? transform.apply(input, options) : input;
}

