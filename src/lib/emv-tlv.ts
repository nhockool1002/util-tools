export interface EmvTlvNode {
  tag: string;
  length: number;
  valueHex: string;
  children?: EmvTlvNode[];
  description?: string;
  printable?: string;
}

const TAG_DICTIONARY: Record<string, string> = {
  "6F": "File Control Information (FCI) Template",
  "84": "Dedicated File (DF) Name",
  "A5": "File Control Information (FCI) Proprietary Template",
  "88": "Short File Identifier (SFI)",
  "5F2D": "Language Preference",
  "9F26": "Application Cryptogram",
  "9F27": "Cryptogram Information Data",
  "9F10": "Issuer Application Data",
  "9F37": "Unpredictable Number",
  "9F36": "Application Transaction Counter (ATC)",
  "95": "Terminal Verification Results",
  "9A": "Transaction Date",
  "9C": "Transaction Type",
  "9F02": "Amount, Authorised (Transaction)",
  "9F03": "Amount, Other (Numeric)",
  "9F1A": "Terminal Country Code",
  "9F33": "Terminal Capabilities",
  "9F34": "Cardholder Verification Method (CVM) Results",
  "9F35": "Terminal Type",
  "9F1E": "Interface Device (IFD) Serial Number",
  "9F09": "Application Version Number",
  "9F41": "Transaction Sequence Counter",
};

function sanitizeHex(input: string): string {
  return input.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
}

function isConstructedTag(firstByte: number): boolean {
  // Bit 6 of first byte = 1 => constructed
  return (firstByte & 0x20) === 0x20;
}

function parseTag(bytes: Uint8Array, offset: number): { tag: string; next: number } {
  if (offset >= bytes.length) return { tag: "", next: offset };
  let tag = bytes[offset].toString(16).toUpperCase().padStart(2, "0");
  let i = offset + 1;
  if ((bytes[offset] & 0x1f) === 0x1f) {
    // multi-byte tag, continuation while bit 8 = 1
    while (i < bytes.length && (bytes[i] & 0x80) === 0x80) {
      tag += bytes[i].toString(16).toUpperCase().padStart(2, "0");
      i++;
    }
    if (i < bytes.length) {
      tag += bytes[i].toString(16).toUpperCase().padStart(2, "0");
      i++;
    }
  }
  return { tag, next: i };
}

function parseLength(bytes: Uint8Array, offset: number): { length: number; next: number } {
  if (offset >= bytes.length) return { length: 0, next: offset };
  const first = bytes[offset];
  if (first < 0x80) {
    return { length: first, next: offset + 1 };
  }
  const numBytes = first & 0x7f;
  let len = 0;
  let i = offset + 1;
  for (let c = 0; c < numBytes && i < bytes.length; c++) {
    len = (len << 8) | bytes[i];
    i++;
  }
  return { length: len, next: i };
}

function bytesToHex(bytes: Uint8Array, start: number, length: number): string {
  const slice = bytes.subarray(start, start + length);
  return Array.from(slice)
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join("");
}

function toPrintable(bytes: Uint8Array): string | undefined {
  if (!bytes.length) return undefined;
  if (bytes.length > 64) return undefined;
  let out = "";
  for (const b of bytes) {
    if (b < 0x20 || b > 0x7e) return undefined;
    out += String.fromCharCode(b);
  }
  return out.trim() || undefined;
}

function parseTlvInternal(bytes: Uint8Array, offset: number, depth = 0): { nodes: EmvTlvNode[]; next: number } {
  const nodes: EmvTlvNode[] = [];
  let i = offset;
  while (i < bytes.length) {
    const { tag, next: afterTag } = parseTag(bytes, i);
    if (!tag) break;
    if (afterTag >= bytes.length) break;
    const { length, next: afterLen } = parseLength(bytes, afterTag);
    // Nếu length vượt quá phần còn lại, clamp về phần còn lại thay vì bỏ toàn bộ.
    const remaining = bytes.length - afterLen;
    const safeLength = Math.min(Math.max(length, 0), Math.max(remaining, 0));
    if (safeLength <= 0) break;

    const valueStart = afterLen;
    const valueEnd = valueStart + safeLength;
    const valueBytes = bytes.subarray(valueStart, valueEnd);

    const node: EmvTlvNode = {
      tag,
      length,
      valueHex: bytesToHex(bytes, valueStart, length),
      description: TAG_DICTIONARY[tag],
    };

    if (isConstructedTag(bytes[i])) {
      const { nodes: children } = parseTlvInternal(valueBytes, 0, depth + 1);
      if (children.length) node.children = children;
    } else {
      const printable = toPrintable(valueBytes);
      if (printable) node.printable = printable;
    }

    nodes.push(node);
    i = valueEnd;
  }
  return { nodes, next: i };
}

export function decodeEmvTlv(hex: string): EmvTlvNode[] {
  const clean = sanitizeHex(hex);
  if (!clean || clean.length % 2 !== 0) return [];
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return parseTlvInternal(bytes, 0).nodes;
}

