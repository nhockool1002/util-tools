"use client";

import { menuCategories } from "@/config/menu";
import { useLanguage } from "@/contexts/language-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { NavItem } from "@/components/molecules/NavItem";
import { Logo } from "@/components/atoms/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeft } from "lucide-react";

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;

export function Sidebar({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { collapsed, toggle } = useSidebar();

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
              <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/90">
                {t(category.labelKey)}
              </h3>
            )}
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
