"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { KcvCalculator } from "@/components/organisms/KcvCalculator";
import { useLanguage } from "@/contexts/language-context";

export default function KcvCalculatorPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.kcvCalculator")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <KcvCalculator />
      </div>
    </DashboardLayout>
  );
}
