"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { JwtDecoder } from "@/components/organisms/JwtDecoder";
import { useLanguage } from "@/contexts/language-context";

export default function JwtDecoderPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.jwtDecoder")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <JwtDecoder />
      </div>
    </DashboardLayout>
  );
}
