"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { useLanguage } from "@/contexts/language-context";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("app.title")}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {t("home.welcome")}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {t("home.selectTool")}
        </p>
      </div>
    </DashboardLayout>
  );
}
