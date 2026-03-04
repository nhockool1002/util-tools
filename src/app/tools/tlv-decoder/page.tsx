"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { EmvTlvDecoder } from "@/components/organisms/EmvTlvDecoder";
import { useLanguage } from "@/contexts/language-context";

export default function TlvDecoderPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.tlvDecoder")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <EmvTlvDecoder />
      </div>
    </DashboardLayout>
  );
}

