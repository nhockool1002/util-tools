import { cn } from "@/lib/utils";

export function AppFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "shrink-0 border-t border-border bg-background px-6 py-3 text-center text-sm text-muted-foreground",
        className
      )}
    >
      NhutNguyen © 2026
    </footer>
  );
}
