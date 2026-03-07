/**
 * Zoom / font size scale options for the whole app.
 * Value is applied as --app-zoom multiplier to root font-size.
 */
export interface ZoomOption {
  id: string;
  /** Percentage label e.g. "90%", "100%" */
  label: string;
  /** Multiplier for root font-size (1 = 100%) */
  scale: number;
}

export const DEFAULT_ZOOM_ID = "100";

export const ZOOM_OPTIONS: ZoomOption[] = [
  { id: "90", label: "90%", scale: 0.9 },
  { id: "100", label: "100%", scale: 1 },
  { id: "110", label: "110%", scale: 1.1 },
  { id: "125", label: "125%", scale: 1.25 },
  { id: "150", label: "150%", scale: 1.5 },
];

export function getZoomOptionById(id: string): ZoomOption | undefined {
  return ZOOM_OPTIONS.find((o) => o.id === id);
}
