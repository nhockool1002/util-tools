"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { ColorPalettes } from "@/components/organisms/ColorPalettes";
import { useLanguage } from "@/contexts/language-context";

export default function ColorPalettesPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.colorPalettes")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <ColorPalettes />
      </div>
    </DashboardLayout>
  );
}

