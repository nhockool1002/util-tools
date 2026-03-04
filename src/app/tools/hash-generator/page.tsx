"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { HashGenerator } from "@/components/organisms/HashGenerator";
import { useLanguage } from "@/contexts/language-context";

export default function HashGeneratorPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.hashGenerator")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <HashGenerator />
      </div>
    </DashboardLayout>
  );
}
