"use client";

import { menuCategories } from "@/config/menu";
import { useLanguage } from "@/contexts/language-context";
import { NavItem } from "@/components/molecules/NavItem";
import { Logo } from "@/components/atoms/Logo";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <aside
      className={cn(
        "flex h-full w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[2px_0_24px_-8px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_24px_-8px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        {menuCategories.map((category) => (
          <div key={category.id} className="mb-6">
            <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/90">
              {t(category.labelKey)}
            </h3>
            <ul className="space-y-1">
              {category.items.map((item) => (
                <li key={item.id}>
                  <NavItem href={item.path} label={t(item.labelKey)} icon={item.icon} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
