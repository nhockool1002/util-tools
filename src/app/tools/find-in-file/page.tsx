"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { FindInFile } from "@/components/organisms/FindInFile";
import { useLanguage } from "@/contexts/language-context";

export default function FindInFilePage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.findInFile")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <FindInFile />
      </div>
    </DashboardLayout>
  );
}
