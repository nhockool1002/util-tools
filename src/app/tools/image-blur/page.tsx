"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { ImageBlurTool } from "@/components/organisms/ImageBlurTool";
import { useLanguage } from "@/contexts/language-context";

export default function ImageBlurPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.imageBlur")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <ImageBlurTool />
      </div>
    </DashboardLayout>
  );
}
