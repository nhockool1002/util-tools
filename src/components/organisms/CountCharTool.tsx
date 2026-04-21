"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { getTextStats } from "@/lib/count-char";

interface StatItem {
  key: string;
  value: number | string;
}

export function CountCharTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState("");

  const stats = useMemo(() => getTextStats(input), [input]);

  const statItems = useMemo<StatItem[]>(
    () => [
      { key: "countChar.characters", value: stats.characters },
      { key: "countChar.nonBlankCharacters", value: stats.nonBlankCharacters },
      { key: "countChar.words", value: stats.words },
      { key: "countChar.spaces", value: stats.spaces },
      { key: "countChar.sentences", value: stats.sentences },
      { key: "countChar.lines", value: stats.lines },
      { key: "countChar.notEmptyLines", value: stats.notEmptyLines },
      { key: "countChar.pages", value: stats.pages.toFixed(1) },
    ],
    [stats]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statItems.map((item) => (
          <div key={item.key} className="rounded-md border border-border bg-background p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t(item.key)}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setInput("")}>
          {t("countChar.clear")}
        </Button>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("countChar.inputPlaceholder")}
        className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        spellCheck={false}
      />
    </div>
  );
}
