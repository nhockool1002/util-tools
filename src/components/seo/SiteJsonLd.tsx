import { buildHomeJsonLd } from "@/lib/seo-metadata";

export function SiteJsonLd() {
  const json = buildHomeJsonLd();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
