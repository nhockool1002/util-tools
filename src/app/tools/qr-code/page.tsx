"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { QrCodeTool } from "@/components/organisms/QrCodeTool";
import { useLanguage } from "@/contexts/language-context";

export default function QrCodePage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.qrCode")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <QrCodeTool />
      </div>
    </DashboardLayout>
  );
}
