"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { FontConverter } from "@/components/organisms/FontConverter";
import { useLanguage } from "@/contexts/language-context";

export default function FontConverterPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.fontConverter")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <FontConverter />
      </div>
    </DashboardLayout>
  );
}

