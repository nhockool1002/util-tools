"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon?: LucideIcon;
  className?: string;
}

export function NavItem({ href, label, icon: Icon, className }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border-l-2 border-primary pl-4"
          : "text-sidebar-foreground/85 hover:text-sidebar-accent-foreground",
        className
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 opacity-90" aria-hidden />}
      {label}
    </Link>
  );
}
