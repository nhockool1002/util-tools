/**
 * ISO 8583 Bitmap: hex string -> bits 1-64 (first) or 1-128 (first + second).
 * Mỗi ký tự hex = 4 bit (MSB trước). 16 ký tự = 64 bit, 32 ký tự = 128 bit.
 */
const HEX_REG = /^[0-9A-Fa-f\s]+$/;

export function normalizeHexInput(input: string): string {
  return input.replace(/\s/g, "").toUpperCase();
}

export function parseHexBitmap(hex: string): boolean[] {
  const cleaned = normalizeHexInput(hex);
  if (!HEX_REG.test(cleaned)) return Array(128).fill(false);
  const len = Math.min(cleaned.length, 32); // tối đa 32 hex = 128 bit
  const bits: boolean[] = [];
  for (let i = 0; i < len; i++) {
    const n = parseInt(cleaned[i] ?? "0", 16);
    bits.push(((n >> 3) & 1) === 1, ((n >> 2) & 1) === 1, ((n >> 1) & 1) === 1, (n & 1) === 1);
  }
  // pad to 128
  while (bits.length < 128) bits.push(false);
  return bits.slice(0, 128);
}

/** Từ mảng 128 bit tạo lại chuỗi hex (16 hoặc 32 ký tự). */
export function bitsToHex(bits: boolean[], includeSecond = true): string {
  const max = includeSecond ? 128 : 64;
  let out = "";
  for (let i = 0; i < max; i += 4) {
    const a = bits[i] ? 8 : 0;
    const b = bits[i + 1] ? 4 : 0;
    const c = bits[i + 2] ? 2 : 0;
    const d = bits[i + 3] ? 1 : 0;
    out += (a + b + c + d).toString(16).toUpperCase();
  }
  return out;
}
