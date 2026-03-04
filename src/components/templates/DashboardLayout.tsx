"use client";

import { Sidebar } from "@/components/organisms/Sidebar";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppFooter } from "@/components/atoms/AppFooter";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function DashboardLayout({
  children,
  title,
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", className)}>
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 bg-muted/30 dark:bg-muted/10">
        <AppHeader title={title} />
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
