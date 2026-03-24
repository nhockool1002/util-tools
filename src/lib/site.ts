export const SITE_NAME = "Util Tools";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://util-tools.vercel.app";
}

export const DEFAULT_DESCRIPTION =
  "Bộ công cụ tiện ích miễn phí: Banking (ISO 8583, EMV TLV, KCV), so sánh file, tìm trong file, Hash, JWT, QR Code, Base64, đổi font, Regex, test responsive. Dark/Light, đa ngôn ngữ.";
