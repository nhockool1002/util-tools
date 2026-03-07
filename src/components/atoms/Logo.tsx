import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** When true (e.g. sidebar collapsed), show short form */
  compact?: boolean;
}

const sizeMap = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

const logoSizeMap = {
  sm: { width: 24, height: 24 },
  md: { width: 28, height: 28 },
  lg: { width: 36, height: 36 },
};

export function Logo({ className, size = "md", compact }: LogoProps) {
  const logoSize = logoSizeMap[size];

  return (
    <Link
      href="/"
      className={cn(
        "font-semibold tracking-tight text-foreground hover:text-foreground/90 transition-colors flex items-center justify-center gap-2",
        !compact && sizeMap[size],
        compact && "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 p-0 gap-0",
        className
      )}
      title={compact ? "Util Tools" : undefined}
    >
      {compact ? (
        <Image
          src="/fire.png"
          alt="Util Tools"
          width={28}
          height={28}
          className="shrink-0 object-contain"
          priority
        />
      ) : (
        <>
          <Image
            src="/fire.png"
            alt=""
            width={logoSize.width}
            height={logoSize.height}
            className="shrink-0 object-contain"
            priority
          />
          <span>Util Tools</span>
        </>
      )}
    </Link>
  );
}
