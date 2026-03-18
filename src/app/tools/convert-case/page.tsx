"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { ConvertCaseTool } from "@/components/organisms/ConvertCaseTool";
import { useLanguage } from "@/contexts/language-context";

export default function ConvertCasePage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.convertCase")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <ConvertCaseTool />
      </div>
    </DashboardLayout>
  );
}

