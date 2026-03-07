"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { RegexTester } from "@/components/organisms/RegexTester";
import { useLanguage } from "@/contexts/language-context";

export default function RegexTesterPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.regexTester")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <RegexTester />
      </div>
    </DashboardLayout>
  );
}
