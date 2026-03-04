/**
 * ISO 8583 Message Builder: DE definitions và logic build message từ MTI + bitmap + giá trị DE.
 * Bit 1 = secondary bitmap (không có value riêng). DE 2 = bit 2, DE 3 = bit 3, ...
 */

export type DeFormat = "fixed" | "llvar" | "lllvar";

export interface DeSpec {
  de: number;
  name: string;
  format: DeFormat;
  length: number; // fixed length, hoặc max length cho var
}

/** Một số DE thường dùng (bit index 0-based = DE number - 1). Bit 0 = DE 1 (secondary bitmap). */
export const DE_SPECS: Record<number, DeSpec> = {
  1: { de: 1, name: "Secondary Bitmap", format: "fixed", length: 0 },
  2: { de: 2, name: "Primary Account Number (PAN)", format: "llvar", length: 19 },
  3: { de: 3, name: "Processing Code", format: "fixed", length: 6 },
  4: { de: 4, name: "Amount, Transaction", format: "fixed", length: 12 },
  7: { de: 7, name: "Transmission Date/Time", format: "fixed", length: 10 },
  11: { de: 11, name: "System Trace Audit Number (STAN)", format: "fixed", length: 6 },
  12: { de: 12, name: "Local Time", format: "fixed", length: 6 },
  13: { de: 13, name: "Local Date", format: "fixed", length: 4 },
  14: { de: 14, name: "Expiration Date", format: "fixed", length: 4 },
  22: { de: 22, name: "POS Entry Mode", format: "fixed", length: 3 },
  35: { de: 35, name: "Track 2 Data", format: "llvar", length: 37 },
  37: { de: 37, name: "Retrieval Reference Number (RRN)", format: "fixed", length: 12 },
  39: { de: 39, name: "Response Code", format: "fixed", length: 2 },
  41: { de: 41, name: "Card Acceptor Terminal ID", format: "fixed", length: 8 },
  42: { de: 42, name: "Card Acceptor ID Code", format: "fixed", length: 15 },
  49: { de: 49, name: "Currency Code", format: "fixed", length: 3 },
  55: { de: 55, name: "EMV Data (TLV)", format: "lllvar", length: 999 },
};

/** Pad fixed: numeric = pad left '0', alphanumeric = pad right ' '. */
function padFixed(value: string, length: number, numeric: boolean): string {
  const v = value.slice(0, length);
  if (numeric) return v.padStart(length, "0");
  return v.padEnd(length, " ");
}

/** Encode one DE value theo spec. */
function encodeDeValue(spec: DeSpec, value: string): string {
  const trimmed = value.trim();
  const isNumeric = spec.format === "fixed" && spec.de !== 35 && spec.de !== 55 && spec.de !== 42 && spec.de !== 41 && spec.de !== 37 && spec.de !== 39;
  if (spec.format === "fixed") {
    return padFixed(trimmed, spec.length, isNumeric);
  }
  if (spec.format === "llvar") {
    const len = Math.min(trimmed.length, spec.length);
    const val = trimmed.slice(0, len);
    return String(val.length).padStart(2, "0") + val;
  }
  if (spec.format === "lllvar") {
    const len = Math.min(trimmed.length, spec.length);
    const val = trimmed.slice(0, len);
    return String(val.length).padStart(3, "0") + val;
  }
  return trimmed;
}

/** Chuyển chuỗi hex (16 hoặc 32 ký tự) thành buffer nhị phân (8 hoặc 16 bytes). */
function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/\s/g, "").toUpperCase();
  if (clean.length % 2 !== 0) return [];
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    out.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return out;
}

/**
 * Build ISO 8583 message: MTI (4 ASCII) + bitmap (8 hoặc 16 bytes) + các DE theo thứ tự bit.
 * Trả về message dạng hex để copy.
 */
export function buildIso8583Message(
  mti: string,
  bitmapHex: string,
  deValues: Record<number, string>
): string {
  const mti4 = mti.trim().slice(0, 4).padEnd(4, " ");
  const bits = hexToBytes(bitmapHex);
  if (bits.length !== 8 && bits.length !== 16) return "";

  const parts: string[] = [];
  // MTI as ASCII bytes
  for (let i = 0; i < mti4.length; i++) {
    parts.push(mti4.charCodeAt(i).toString(16).padStart(2, "0"));
  }
  // Bitmap bytes
  for (const b of bits) {
    parts.push(b.toString(16).padStart(2, "0"));
  }

  // DEs: bit 1 = index 0 (secondary bitmap, no value), bit 2 = DE2 = index 1, ...
  for (let bitIndex = 1; bitIndex <= Math.min(bits.length * 8, 128); bitIndex++) {
    const byteIndex = Math.floor((bitIndex - 1) / 8);
    const bitInByte = 7 - (bitIndex - 1) % 8;
    if (byteIndex >= bits.length) break;
    if ((bits[byteIndex]! >> bitInByte & 1) === 0) continue;

    const deNum = bitIndex;
    const spec = DE_SPECS[deNum];
    const value = (deNum === 1 ? "" : (deValues[deNum] ?? "")).trim();
    if (deNum === 1) continue; // no value for secondary bitmap

    const specToUse = spec ?? { de: deNum, name: `DE${deNum}`, format: "llvar" as DeFormat, length: 99 };
    const encoded = encodeDeValue(specToUse, value || "");
    for (let i = 0; i < encoded.length; i++) {
      parts.push(encoded.charCodeAt(i).toString(16).padStart(2, "0"));
    }
  }

  return parts.join("").toUpperCase();
}

/** Trả về danh sách số DE (1..128) tương ứng các bit đang bật trong bitmap hex. */
export function getSetDeNumbers(bitmapHex: string): number[] {
  const bytes = hexToBytes(bitmapHex);
  const out: number[] = [];
  for (let bitIndex = 1; bitIndex <= bytes.length * 8; bitIndex++) {
    const byteIndex = Math.floor((bitIndex - 1) / 8);
    const bitInByte = 7 - (bitIndex - 1) % 8;
    if (byteIndex < bytes.length && (bytes[byteIndex]! >> bitInByte & 1) === 1) {
      out.push(bitIndex);
    }
  }
  return out;
}
