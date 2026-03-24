import { menuCategories } from "@/config/menu";
import { toolsSeo } from "@/config/tools-seo";

for (const category of menuCategories) {
  for (const item of category.items) {
    if (!toolsSeo[item.path]) {
      throw new Error(
        `[SEO] Thiếu mục toolsSeo cho "${item.path}" (id: ${item.id}). Cập nhật src/config/tools-seo.ts.`
      );
    }
  }
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
