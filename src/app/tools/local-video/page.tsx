"use client";

import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { LocalVideoPlayer } from "@/components/organisms/LocalVideoPlayer";
import { useLanguage } from "@/contexts/language-context";

export default function LocalVideoPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("nav.localVideo")}>
      <div className="relative rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl shadow-black/5 dark:shadow-black/25 overflow-hidden">
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none"
          aria-hidden
        />
        <div className="relative">
          <LocalVideoPlayer />
        </div>
      </div>
    </DashboardLayout>
  );
}
