"use client";

import { ResponsiveTest } from "@/components/organisms/ResponsiveTest";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { useLanguage } from "@/contexts/language-context";

export default function ResponsiveTestPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.responsiveTest")}>
      <ResponsiveTest />
    </DashboardLayout>
  );
}
