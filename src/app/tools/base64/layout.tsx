import { toolsSeo } from "@/config/tools-seo";
import { buildToolMetadata } from "@/lib/seo-metadata";

const path = "/tools/base64";
const seo = toolsSeo[path];

export const metadata = buildToolMetadata(seo.title, seo.description, path);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
