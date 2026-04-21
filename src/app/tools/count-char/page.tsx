"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { CountCharTool } from "@/components/organisms/CountCharTool";
import { useLanguage } from "@/contexts/language-context";

export default function CountCharPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.countChar")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <CountCharTool />
      </div>
    </DashboardLayout>
  );
}
