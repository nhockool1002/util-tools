/**
 * Google Fonts available for global app font switching.
 * id: used in state/storage; family: exact name for CSS & Google Fonts URL.
 */
export interface AppFont {
  id: string;
  /** Display name in UI */
  label: string;
  family: string;
  /** For Google Fonts URL: family name with + instead of space */
  googleFamily: string;
}

export const DEFAULT_FONT_ID = "default";

/** At least 20 common Google Fonts + default (Geist) */
export const APP_FONTS: AppFont[] = [
  { id: DEFAULT_FONT_ID, label: "Default", family: "var(--font-geist-sans), system-ui, sans-serif", googleFamily: "" },
  { id: "inter", label: "Inter", family: "Inter, system-ui, sans-serif", googleFamily: "Inter:wght@400;500;600;700" },
  { id: "roboto", label: "Roboto", family: "Roboto, system-ui, sans-serif", googleFamily: "Roboto:wght@400;500;700" },
  { id: "open-sans", label: "Open Sans", family: "'Open Sans', system-ui, sans-serif", googleFamily: "Open+Sans:wght@400;500;600;700" },
  { id: "lato", label: "Lato", family: "Lato, system-ui, sans-serif", googleFamily: "Lato:wght@400;700" },
  { id: "montserrat", label: "Montserrat", family: "Montserrat, system-ui, sans-serif", googleFamily: "Montserrat:wght@400;500;600;700" },
  { id: "oswald", label: "Oswald", family: "Oswald, system-ui, sans-serif", googleFamily: "Oswald:wght@400;500;600;700" },
  { id: "poppins", label: "Poppins", family: "Poppins, system-ui, sans-serif", googleFamily: "Poppins:wght@400;500;600;700" },
  { id: "source-sans-3", label: "Source Sans 3", family: "'Source Sans 3', system-ui, sans-serif", googleFamily: "Source+Sans+3:wght@400;500;600;700" },
  { id: "raleway", label: "Raleway", family: "Raleway, system-ui, sans-serif", googleFamily: "Raleway:wght@400;500;600;700" },
  { id: "nunito", label: "Nunito", family: "Nunito, system-ui, sans-serif", googleFamily: "Nunito:wght@400;600;700" },
  { id: "ubuntu", label: "Ubuntu", family: "Ubuntu, system-ui, sans-serif", googleFamily: "Ubuntu:wght@400;500;700" },
  { id: "playfair-display", label: "Playfair Display", family: "'Playfair Display', system-ui, serif", googleFamily: "Playfair+Display:wght@400;500;600;700" },
  { id: "merriweather", label: "Merriweather", family: "Merriweather, Georgia, serif", googleFamily: "Merriweather:wght@400;700" },
  { id: "pt-sans", label: "PT Sans", family: "'PT Sans', system-ui, sans-serif", googleFamily: "PT+Sans:wght@400;700" },
  { id: "roboto-condensed", label: "Roboto Condensed", family: "'Roboto Condensed', system-ui, sans-serif", googleFamily: "Roboto+Condensed:wght@400;700" },
  { id: "noto-sans", label: "Noto Sans", family: "'Noto Sans', system-ui, sans-serif", googleFamily: "Noto+Sans:wght@400;500;600;700" },
  { id: "work-sans", label: "Work Sans", family: "'Work Sans', system-ui, sans-serif", googleFamily: "Work+Sans:wght@400;500;600;700" },
  { id: "quicksand", label: "Quicksand", family: "Quicksand, system-ui, sans-serif", googleFamily: "Quicksand:wght@400;500;600;700" },
  { id: "rubik", label: "Rubik", family: "Rubik, system-ui, sans-serif", googleFamily: "Rubik:wght@400;500;600;700" },
  { id: "karla", label: "Karla", family: "Karla, system-ui, sans-serif", googleFamily: "Karla:wght@400;500;600;700" },
  { id: "dm-sans", label: "DM Sans", family: "'DM Sans', system-ui, sans-serif", googleFamily: "DM+Sans:wght@400;500;600;700" },
  { id: "manrope", label: "Manrope", family: "Manrope, system-ui, sans-serif", googleFamily: "Manrope:wght@400;500;600;700" },
  { id: "plus-jakarta-sans", label: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', system-ui, sans-serif", googleFamily: "Plus+Jakarta+Sans:wght@400;500;600;700" },
  { id: "outfit", label: "Outfit", family: "Outfit, system-ui, sans-serif", googleFamily: "Outfit:wght@400;500;600;700" },
  { id: "bebas-neue", label: "Bebas Neue", family: "'Bebas Neue', system-ui, sans-serif", googleFamily: "Bebas+Neue" },
];

export function getFontById(id: string): AppFont | undefined {
  return APP_FONTS.find((f) => f.id === id);
}

export function getFontFamilyForBody(id: string): string {
  const font = getFontById(id);
  return font ? font.family : APP_FONTS[0].family;
}
