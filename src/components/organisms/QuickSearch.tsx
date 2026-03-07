"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { menuCategories } from "@/config/menu";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface FlatItem {
  path: string;
  label: string;
  categoryLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface QuickSearchContentProps {
  open: boolean;
  onClose: () => void;
}

export function QuickSearchContent({ open, onClose }: QuickSearchContentProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const flattened = useMemo(
    () =>
      menuCategories.flatMap((cat) =>
        cat.items.map((item) => ({
          path: item.path,
          label: t(item.labelKey),
          categoryLabel: t(cat.labelKey),
          icon: item.icon,
        }))
      ),
    [t]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flattened;
    return flattened.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.categoryLabel.toLowerCase().includes(q)
    );
  }, [flattened, query]);

  const selectItem = useCallback(
    (item: FlatItem) => {
      router.push(item.path);
      onClose();
    },
    [router, onClose]
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (selectedIndex < 0) setSelectedIndex(filtered.length - 1);
    if (selectedIndex >= filtered.length) setSelectedIndex(0);
  }, [selectedIndex, filtered.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const child = el.children[selectedIndex] as HTMLElement | undefined;
    child?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, filtered]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (i) => (i - 1 + filtered.length) % filtered.length
        );
        return;
      }
      if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        selectItem(filtered[selectedIndex]);
      }
    },
    [onClose, filtered, selectedIndex, selectItem]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("quickSearch.ariaLabel")}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-xl rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("quickSearch.placeholder")}
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto py-2"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("quickSearch.noResults")}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => selectItem(item)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                        i === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/70"
                      )}
                    >
                      <Icon className="size-4 shrink-0 opacity-80" />
                      <span className="flex-1 truncate">{item.label}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {item.categoryLabel}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>↑↓ {t("quickSearch.navigate")}</span>
          <span>↵ {t("quickSearch.select")}</span>
          <span>Esc {t("quickSearch.close")}</span>
        </div>
      </div>
    </div>
  );
}
