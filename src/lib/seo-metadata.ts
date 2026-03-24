import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/site";

export function buildToolMetadata(
  title: string,
  description: string,
  path: string
): Metadata {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${path}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: pageUrl,
      images: [{ url: "/fire.png", width: 512, height: 512, alt: `${title} – ${SITE_NAME}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/fire.png"],
    },
  };
}

export function buildHomeJsonLd(): object {
  const siteUrl = getSiteUrl();
  const toolPaths = [
    "/tools/bitmap-encoder",
    "/tools/tlv-decoder",
    "/tools/kcv-calculator",
    "/tools/base64",
    "/tools/color-palettes",
    "/tools/convert-case",
    "/tools/font-converter",
    "/tools/hash-generator",
    "/tools/jwt-decoder",
    "/tools/qr-code",
    "/tools/regex-tester",
    "/tools/responsive-test",
    "/tools/compare-file",
    "/tools/find-in-file",
    "/tools/screen-recorder",
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        inLanguage: ["vi", "en"],
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_NAME,
        url: siteUrl,
        logo: { "@type": "ImageObject", url: `${siteUrl}/fire.png` },
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/#tools`,
        name: `${SITE_NAME} – Danh sách công cụ`,
        numberOfItems: toolPaths.length,
        itemListElement: toolPaths.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${siteUrl}${p}`,
        })),
      },
    ],
  };
}
