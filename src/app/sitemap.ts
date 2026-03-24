import type { MetadataRoute } from "next";
import { menuCategories } from "@/config/menu";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  const toolEntries: MetadataRoute.Sitemap = menuCategories.flatMap((category) =>
    category.items.map((item) => ({
      url: `${base}${item.path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }))
  );

  return [
    {
      url: base,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...toolEntries,
  ];
}
