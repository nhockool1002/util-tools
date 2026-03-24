import type { MetadataRoute } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    lang: "vi",
    icons: [
      {
        src: "/fire.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/fire.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
