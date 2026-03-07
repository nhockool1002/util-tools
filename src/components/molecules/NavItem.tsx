"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon?: LucideIcon;
  className?: string;
  collapsed?: boolean;
}

export function NavItem({ href, label, icon: Icon, className, collapsed }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  const linkContent = (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-xl text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center gap-0 px-0 py-2.5 w-full" : "gap-3 px-3.5 py-2.5",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border-l-2 border-primary"
          : "text-sidebar-foreground/85 hover:text-sidebar-accent-foreground",
        collapsed ? "justify-center pl-0" : "pl-4",
        className
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 opacity-90" aria-hidden />}
      {!collapsed && label}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
