"use client";

import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { useLanguage } from "@/contexts/language-context";

const LocalVideoPlayer = dynamic(
  () =>
    import("@/components/organisms/LocalVideoPlayer").then((m) => m.LocalVideoPlayer),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[min(280px,40vh)] items-center justify-center rounded-xl border border-dashed border-border bg-muted/25"
        role="status"
        aria-busy
      >
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  }
);

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
