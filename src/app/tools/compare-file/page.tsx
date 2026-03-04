"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { CompareFile } from "@/components/organisms/CompareFile";
import { useLanguage } from "@/contexts/language-context";

export default function CompareFilePage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.compareFile")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <CompareFile />
      </div>
    </DashboardLayout>
  );
}
