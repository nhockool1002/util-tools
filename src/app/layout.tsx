import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} – Công cụ tiện ích trực tuyến`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "util tools",
    "công cụ tiện ích",
    "banking tools",
    "ISO 8583",
    "EMV TLV",
    "KCV",
    "hash generator",
    "JWT decoder",
    "base64",
    "regex tester",
    "compare file",
    "font converter",
    "QR code",
    "responsive test",
    "ghi màn hình",
  ],
  authors: [{ name: "Nhut Nguyen", url: siteUrl }],
  creator: "Nhut Nguyen",
  publisher: "Nhut Nguyen",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  referrer: "origin-when-cross-origin",
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    alternateLocale: ["en_US"],
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Công cụ tiện ích trực tuyến`,
    description: DEFAULT_DESCRIPTION,
    url: siteUrl,
    images: [{ url: "/fire.png", width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} – Công cụ tiện ích trực tuyến`,
    description: DEFAULT_DESCRIPTION,
    images: ["/fire.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  category: "technology",
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <SiteJsonLd />
        <TooltipProvider>
          <AppProviders>{children}</AppProviders>
        </TooltipProvider>
      </body>
    </html>
  );
}
