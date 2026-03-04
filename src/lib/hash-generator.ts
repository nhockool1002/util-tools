/**
 * Hash Generator - supports multiple algorithms via crypto-js
 * MD5, SHA1, SHA224, SHA256, SHA384, SHA512, SHA3 (224/256/384/512), RIPEMD160
 * With optional HMAC for each.
 */
import CryptoJS from "crypto-js";

export type HashAlgorithmId =
  | "md5"
  | "sha1"
  | "sha224"
  | "sha256"
  | "sha384"
  | "sha512"
  | "sha3-224"
  | "sha3-256"
  | "sha3-384"
  | "sha3-512"
  | "ripemd160";

export interface HashAlgorithm {
  id: HashAlgorithmId;
  name: string;
  description?: string;
}

export const HASH_ALGORITHMS: HashAlgorithm[] = [
  { id: "md5", name: "MD5", description: "128-bit" },
  { id: "sha1", name: "SHA-1", description: "160-bit" },
  { id: "sha224", name: "SHA-224", description: "224-bit" },
  { id: "sha256", name: "SHA-256", description: "256-bit" },
  { id: "sha384", name: "SHA-384", description: "384-bit" },
  { id: "sha512", name: "SHA-512", description: "512-bit" },
  { id: "sha3-224", name: "SHA3-224", description: "SHA-3 224-bit" },
  { id: "sha3-256", name: "SHA3-256", description: "SHA-3 256-bit" },
  { id: "sha3-384", name: "SHA3-384", description: "SHA-3 384-bit" },
  { id: "sha3-512", name: "SHA3-512", description: "SHA-3 512-bit" },
  { id: "ripemd160", name: "RIPEMD-160", description: "160-bit" },
];

export interface HashResult {
  success: boolean;
  hex?: string;
  error?: string;
}

function hashWithCryptoJs(
  message: string,
  algorithmId: HashAlgorithmId,
  hmacKey?: string
): string {
  const wordMessage = CryptoJS.enc.Utf8.parse(message);

  if (hmacKey && hmacKey.trim() !== "") {
    const key = CryptoJS.enc.Utf8.parse(hmacKey);
    switch (algorithmId) {
      case "md5":
        return CryptoJS.HmacMD5(message, key).toString(CryptoJS.enc.Hex);
      case "sha1":
        return CryptoJS.HmacSHA1(message, key).toString(CryptoJS.enc.Hex);
      case "sha224":
        return CryptoJS.HmacSHA224(message, key).toString(CryptoJS.enc.Hex);
      case "sha256":
        return CryptoJS.HmacSHA256(message, key).toString(CryptoJS.enc.Hex);
      case "sha384":
        return CryptoJS.HmacSHA384(message, key).toString(CryptoJS.enc.Hex);
      case "sha512":
        return CryptoJS.HmacSHA512(message, key).toString(CryptoJS.enc.Hex);
      case "sha3-224":
      case "sha3-256":
      case "sha3-384":
      case "sha3-512":
        return CryptoJS.HmacSHA3(message, key).toString(CryptoJS.enc.Hex);
      case "ripemd160":
        return CryptoJS.HmacRIPEMD160(message, key).toString(CryptoJS.enc.Hex);
      default:
        return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
    }
  }

  switch (algorithmId) {
    case "md5":
      return CryptoJS.MD5(message).toString(CryptoJS.enc.Hex);
    case "sha1":
      return CryptoJS.SHA1(message).toString(CryptoJS.enc.Hex);
    case "sha224":
      return CryptoJS.SHA224(message).toString(CryptoJS.enc.Hex);
    case "sha256":
      return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
    case "sha384":
      return CryptoJS.SHA384(message).toString(CryptoJS.enc.Hex);
    case "sha512":
      return CryptoJS.SHA512(message).toString(CryptoJS.enc.Hex);
    case "sha3-224":
      return (CryptoJS.SHA3 as (m: string, o?: { outputLength?: number }) => CryptoJS.lib.WordArray)(
        message,
        { outputLength: 224 }
      ).toString(CryptoJS.enc.Hex);
    case "sha3-256":
      return (CryptoJS.SHA3 as (m: string, o?: { outputLength?: number }) => CryptoJS.lib.WordArray)(
        message,
        { outputLength: 256 }
      ).toString(CryptoJS.enc.Hex);
    case "sha3-384":
      return (CryptoJS.SHA3 as (m: string, o?: { outputLength?: number }) => CryptoJS.lib.WordArray)(
        message,
        { outputLength: 384 }
      ).toString(CryptoJS.enc.Hex);
    case "sha3-512":
      return (CryptoJS.SHA3 as (m: string, o?: { outputLength?: number }) => CryptoJS.lib.WordArray)(
        message,
        { outputLength: 512 }
      ).toString(CryptoJS.enc.Hex);
    case "ripemd160":
      return (CryptoJS as unknown as { RIPEMD160: (m: string) => CryptoJS.lib.WordArray }).RIPEMD160(
        message
      ).toString(CryptoJS.enc.Hex);
    default:
      return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
  }
}

export function computeHash(
  input: string,
  algorithmId: HashAlgorithmId,
  hmacKey?: string
): HashResult {
  if (!input.trim()) {
    return { success: false, error: "Input is empty" };
  }
  try {
    const hex = hashWithCryptoJs(input, algorithmId, hmacKey);
    return { success: true, hex };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
