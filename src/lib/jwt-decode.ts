/**
 * JWT Decoder - decode header and payload (no verification, client-side only)
 */

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  try {
    return decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return atob(padded);
  }
}

export interface JwtDecoded {
  success: boolean;
  header?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  signatureRaw?: string;
  error?: string;
}

export function decodeJwt(token: string): JwtDecoded {
  const trimmed = token.trim();
  if (!trimmed) return { success: false, error: "Empty token" };

  const parts = trimmed.split(".");
  if (parts.length !== 3) return { success: false, error: "Invalid JWT format (expected 3 parts)" };

  try {
    const [headerB64, payloadB64, sigB64] = parts;
    const headerJson = base64UrlDecode(headerB64);
    const payloadJson = base64UrlDecode(payloadB64);

    const header = JSON.parse(headerJson) as Record<string, unknown>;
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;

    return {
      success: true,
      header,
      payload,
      signatureRaw: sigB64,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
