import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://util-tools.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Util Tools – Công cụ tiện ích trực tuyến",
    template: "%s | Util Tools",
  },
  description:
    "Bộ công cụ tiện ích miễn phí: Banking (ISO 8583, EMV TLV, KCV), so sánh file, tìm trong file, Hash, JWT, QR Code, Base64, đổi font, Regex. Hỗ trợ Dark/Light, đa ngôn ngữ.",
  keywords: [
    "util tools",
    "công cụ tiện ích",
    "banking tools",
    "ISO 8583",
    "EMV TLV",
    "hash generator",
    "JWT decoder",
    "base64",
    "regex tester",
    "compare file",
    "font converter",
    "QR code",
  ],
  authors: [{ name: "Nhut Nguyen", url: siteUrl }],
  creator: "Nhut Nguyen",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    alternateLocale: "en_US",
    siteName: "Util Tools",
    title: "Util Tools – Công cụ tiện ích trực tuyến",
    description:
      "Bộ công cụ tiện ích miễn phí: Banking, File, Developer. Hỗ trợ Dark/Light, đa ngôn ngữ.",
    url: siteUrl,
    images: [{ url: "/fire.png", width: 512, height: 512, alt: "Util Tools" }],
  },
  twitter: {
    card: "summary",
    title: "Util Tools – Công cụ tiện ích trực tuyến",
    description: "Bộ công cụ tiện ích miễn phí cho Banking, File và Developer.",
    images: ["/fire.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/fire.png",
    apple: "/fire.png",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <TooltipProvider>
          <AppProviders>{children}</AppProviders>
        </TooltipProvider>
      </body>
    </html>
  );
}
