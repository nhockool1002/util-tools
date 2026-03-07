import { cn } from "@/lib/utils";

export function AppFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "shrink-0 border-t border-border bg-background px-6 py-3 text-center text-sm text-muted-foreground",
        className
      )}
    >
      <p className="font-medium text-foreground/90">
        © {year} Util Tools. All rights reserved.
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground/90">
        Created by Nhut Nguyen
      </p>
    </footer>
  );
}
