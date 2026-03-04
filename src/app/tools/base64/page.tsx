"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { Base64Tool } from "@/components/organisms/Base64Tool";
import { useLanguage } from "@/contexts/language-context";

export default function Base64Page() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.base64")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <Base64Tool />
      </div>
    </DashboardLayout>
  );
}
