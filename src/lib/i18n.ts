import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

export type Locale = "en" | "vi";

const translations: Record<Locale, typeof en> = { en, vi };

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function getTranslation(locale: Locale, key: string): string {
  const value = getNested(translations[locale] as Record<string, unknown>, key);
  return value ?? key;
}

export { en, vi };
