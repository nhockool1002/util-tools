"use client";

import { menuCategories } from "@/config/menu";
import { useLanguage } from "@/contexts/language-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { NavItem } from "@/components/molecules/NavItem";
import { Logo } from "@/components/atoms/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const CATEGORY_STORAGE_KEY = "util-tools-sidebar-category-state";

type CategoryState = Record<string, boolean>;

export function Sidebar({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  const allExpandedCategoryState = useMemo(
    () =>
      menuCategories.reduce<CategoryState>((acc, category) => {
        acc[category.id] = true;
        return acc;
      }, {}),
    []
  );

  const [expandedByCategory, setExpandedByCategory] = useState<CategoryState>(allExpandedCategoryState);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as CategoryState;
      setExpandedByCategory((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore invalid saved sidebar category state
    }
  }, []);

  const persistCategoryState = useCallback((next: CategoryState) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const toggleCategory = useCallback(
    (categoryId: string) => {
      setExpandedByCategory((prev) => {
        const next = { ...prev, [categoryId]: !prev[categoryId] };
        persistCategoryState(next);
        return next;
      });
    },
    [persistCategoryState]
  );

  useEffect(() => {
    if (!pathname) return;

    const activeCategory = menuCategories.find((category) =>
      category.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    );

    if (!activeCategory) return;

    setExpandedByCategory((prev) => {
      if (prev[activeCategory.id]) return prev;
      const next = { ...prev, [activeCategory.id]: true };
      persistCategoryState(next);
      return next;
    });
  }, [pathname, persistCategoryState]);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[2px_0_24px_-8px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_24px_-8px_rgba(0,0,0,0.35)] transition-[width] duration-200 ease-out",
        className
      )}
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border gap-2 transition-[padding] duration-200",
          collapsed ? "justify-center px-0" : "px-5"
        )}
      >
        {collapsed ? (
          <Logo size="sm" compact />
        ) : (
          <Logo size="sm" />
        )}
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {menuCategories.map((category) => (
          <div key={category.id} className={cn("mb-6", collapsed && "mb-4")}>
            {!collapsed && (
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                aria-label={`${
                  expandedByCategory[category.id] ? t("sidebar.collapseCategory") : t("sidebar.expandCategory")
                }: ${t(category.labelKey)}`}
                title={`${
                  expandedByCategory[category.id] ? t("sidebar.collapseCategory") : t("sidebar.expandCategory")
                }: ${t(category.labelKey)}`}
                className="mb-2 flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/90 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              >
                <span>{t(category.labelKey)}</span>
                {expandedByCategory[category.id] ? (
                  <ChevronDown className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                )}
              </button>
            )}
            {(collapsed || expandedByCategory[category.id]) && (
              <ul className="space-y-1">
                {category.items.map((item) => (
                  <li key={item.id}>
                    <NavItem
                      href={item.path}
                      label={t(item.labelKey)}
                      icon={item.icon}
                      collapsed={collapsed}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
      <div
        className={cn(
          "flex border-t border-sidebar-border p-2",
          collapsed ? "justify-center" : "justify-end"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
