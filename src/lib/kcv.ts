/**
 * KCV (Key Check Value) Calculator
 * Chuẩn: Encrypt 8 bytes zeros với key, lấy 3 byte đầu (6 hex) làm KCV.
 * Hỗ trợ: DES (16 hex), 2-key 3DES (32 hex), 3-key 3DES (48 hex).
 */
import CryptoJS from "crypto-js";

const ZERO_8 = CryptoJS.lib.WordArray.create([0, 0], 8);

function hexToWordArray(hex: string): CryptoJS.lib.WordArray {
  const clean = hex.replace(/\s/g, "").toUpperCase();
  return CryptoJS.enc.Hex.parse(clean);
}

function wordArrayToHex(wa: CryptoJS.lib.WordArray): string {
  return CryptoJS.enc.Hex.stringify(wa).toUpperCase();
}

/** Trích 3 byte đầu (6 hex) từ kết quả encrypt. */
function truncateKcv(wa: CryptoJS.lib.WordArray): string {
  const hex = wordArrayToHex(wa);
  return hex.slice(0, 6).toUpperCase();
}

export type KeyType = "DES" | "2KEY_3DES" | "3KEY_3DES";

export interface KcvResult {
  success: boolean;
  kcv?: string;
  keyType?: KeyType;
  error?: string;
}

/**
 * Tính KCV cho key hex.
 * DES: 16 hex | 2-key 3DES: 32 hex | 3-key 3DES: 48 hex | AES: 32/48/64 hex
 */
export function calculateKcv(keyHex: string): KcvResult {
  const clean = keyHex.replace(/\s/g, "").toUpperCase();
  if (!/^[0-9A-Fa-f]+$/.test(clean)) {
    return { success: false, error: "Key must be hexadecimal only" };
  }

  const len = clean.length;
  let keyType: KeyType | null = null;

  if (len === 16) keyType = "DES";
  else if (len === 32) keyType = "2KEY_3DES";
  else if (len === 48) keyType = "3KEY_3DES";

  if (!keyType) {
    return {
      success: false,
      error: `Invalid key length: ${len} hex chars. Use 16 (DES), 32 (2-key 3DES), or 48 (3-key 3DES)`,
    };
  }

  try {
    const key = hexToWordArray(clean);
    let encrypted: CryptoJS.lib.WordArray;

    if (keyType === "DES") {
      encrypted = CryptoJS.DES.encrypt(ZERO_8, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding,
      }).ciphertext;
    } else {
      encrypted = CryptoJS.TripleDES.encrypt(ZERO_8, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding,
      }).ciphertext;
    }

    const kcv = truncateKcv(encrypted);
    return { success: true, kcv, keyType };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
