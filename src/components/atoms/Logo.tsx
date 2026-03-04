import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "font-semibold tracking-tight text-foreground hover:text-foreground/90 transition-colors",
        sizeMap[size],
        className
      )}
    >
      Util Tools
    </Link>
  );
}
