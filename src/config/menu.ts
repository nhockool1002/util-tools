import type { LucideIcon } from "lucide-react";
import {
  Binary,
  FileCode,
  FileSearch,
  GitCompare,
  KeyRound,
  Monitor,
  Hash,
  Key,
  QrCode,
  FileText,
  Type,
  Regex,
  CaseSensitive,
  Palette,
  Smartphone,
  Clapperboard,
} from "lucide-react";

export type MenuItemId =
  | "bitmap-encoder"
  | "tlv-decoder"
  | "kcv-calculator"
  | "find-in-file"
  | "compare-file"
  | "screen-recorder"
  | "hash-generator"
  | "jwt-decoder"
  | "qr-code"
  | "base64"
  | "font-converter"
  | "color-palettes"
  | "regex-tester"
  | "convert-case"
  | "responsive-test"
  | "local-video";

export interface MenuItem {
  id: MenuItemId;
  path: string;
  labelKey: string;
  icon: LucideIcon;
}

export interface MenuCategory {
  id: string;
  labelKey: string;
  items: MenuItem[];
}

export const menuCategories: MenuCategory[] = [
  {
    id: "banking",
    labelKey: "nav.bankingTool",
    items: [
      { id: "bitmap-encoder", path: "/tools/bitmap-encoder", labelKey: "nav.bitmapEncoder", icon: Binary },
      { id: "tlv-decoder", path: "/tools/tlv-decoder", labelKey: "nav.tlvDecoder", icon: FileCode },
      { id: "kcv-calculator", path: "/tools/kcv-calculator", labelKey: "nav.kcvCalculator", icon: KeyRound },
    ],
  },
  {
    id: "developer",
    labelKey: "nav.developerTool",
    items: [
      { id: "base64", path: "/tools/base64", labelKey: "nav.base64", icon: FileText },
      { id: "color-palettes", path: "/tools/color-palettes", labelKey: "nav.colorPalettes", icon: Palette },
      { id: "convert-case", path: "/tools/convert-case", labelKey: "nav.convertCase", icon: CaseSensitive },
      {
        id: "font-converter",
        path: "/tools/font-converter",
        labelKey: "nav.fontConverter",
        icon: Type,
      },
      { id: "hash-generator", path: "/tools/hash-generator", labelKey: "nav.hashGenerator", icon: Hash },
      { id: "jwt-decoder", path: "/tools/jwt-decoder", labelKey: "nav.jwtDecoder", icon: Key },
      { id: "qr-code", path: "/tools/qr-code", labelKey: "nav.qrCode", icon: QrCode },
      { id: "regex-tester", path: "/tools/regex-tester", labelKey: "nav.regexTester", icon: Regex },
      {
        id: "responsive-test",
        path: "/tools/responsive-test",
        labelKey: "nav.responsiveTest",
        icon: Smartphone,
      },
    ],
  },
  {
    id: "file",
    labelKey: "nav.fileTool",
    items: [
      { id: "compare-file", path: "/tools/compare-file", labelKey: "nav.compareFile", icon: GitCompare },
      { id: "find-in-file", path: "/tools/find-in-file", labelKey: "nav.findInFile", icon: FileSearch },
    ],
  },
  {
    id: "media",
    labelKey: "nav.mediaTool",
    items: [
      { id: "screen-recorder", path: "/tools/screen-recorder", labelKey: "nav.screenRecorder", icon: Monitor },
      { id: "local-video", path: "/tools/local-video", labelKey: "nav.localVideo", icon: Clapperboard },
    ],
  },
];
