/**
 * Base64 Encode / Decode (UTF-8 text)
 */

export function encodeBase64(text: string): string {
  try {
    return btoa(
      encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(Number.parseInt(p1, 16))
      )
    );
  } catch {
    return "";
  }
}

export interface DecodeResult {
  success: boolean;
  text?: string;
  error?: string;
}

export function decodeBase64(input: string): DecodeResult {
  const cleaned = input.replace(/\s/g, "").trim();
  if (!cleaned) return { success: false, error: "Empty input" };

  if (cleaned.length % 4 !== 0) {
    const padded = cleaned + "=".repeat((4 - (cleaned.length % 4)) % 4);
    try {
      const decoded = decodeUriComponentFromBase64(padded);
      return { success: true, text: decoded };
    } catch {
      return { success: false, error: "Invalid Base64 input" };
    }
  }

  try {
    const decoded = decodeUriComponentFromBase64(cleaned);
    return { success: true, text: decoded };
  } catch {
    return { success: false, error: "Invalid Base64 input" };
  }
}

function decodeUriComponentFromBase64(base64: string): string {
  const binary = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  try {
    return decodeURIComponent(
      binary
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return binary;
  }
}
