"use client";

import { AttachmentCleaner } from "@/components/organisms/AttachmentCleaner";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { useLanguage } from "@/contexts/language-context";

export default function AttachmentCleanerPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.attachmentCleaner")}>
      <div className="rounded-lg border border-border bg-card p-6">
        <AttachmentCleaner />
      </div>
    </DashboardLayout>
  );
}
