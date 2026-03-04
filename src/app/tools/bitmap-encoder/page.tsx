"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { Iso8583Bitmap } from "@/components/organisms/Iso8583Bitmap";
import { useLanguage } from "@/contexts/language-context";

export default function BitmapEncoderPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.bitmapEncoder")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <Iso8583Bitmap />
      </div>
    </DashboardLayout>
  );
}
