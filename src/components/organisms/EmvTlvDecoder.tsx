"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { decodeEmvTlv, type EmvTlvNode } from "@/lib/emv-tlv";
import { cn } from "@/lib/utils";
import { Copy, FileText } from "lucide-react";

const DEMO_SAMPLES: string[] = [
  // Simple FCI with DF Name and Language Preference (gần giống hình)
  "6F1A840E315041592E5359532E4444463031A5088801025F2D02656E",
  "6F1E840E325041592E5359532E4444463031A60C9F1101019F12044D41494E5F2D02656E",
  "701A9F1A0208409F360200019F2608AABBCCDDEEFF00119F270180",
  "70819F269F27089F10120110A00003220000000000000000000000",
  "6F20840E325041592E5359532E4444463031A60E9F38069F66049F6E045F2D02656E",
  "7081A49F2608D4E5F6A7B8C9D0E19F2701809F10120110A00003220000000000000000000000",
  "70819F329F33039F35019F1A0208405F2A0208409A032312319C019F3704A1B2C3D4",
  "6F2A840E315041592E5359532E4444463031A6189F38069F66049F6E049F1101015F2D02656EFF00",
  "70109F1E0831323334353637389F3602001A",
  "70819F109F269F279F36",
];

interface EmvTlvRowProps {
  node: EmvTlvNode;
  depth: number;
}

function EmvTlvRow({ node, depth }: EmvTlvRowProps) {
  const { t } = useLanguage();
  const indent = depth * 16;

  return (
    <div className="relative">
      {depth > 0 && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 border-l border-dotted border-border/60"
          style={{ marginLeft: `${indent - 12}px` }}
        />
      )}
      <div
        className={cn(
          "flex flex-col gap-1 border-b border-dotted border-border/70 pb-2 pt-2",
          depth === 0 && "first:pt-0"
        )}
        style={{ paddingLeft: `${indent}px` }}
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {node.tag}
          </span>
          {node.description && (
            <span className="text-sm font-semibold text-red-400 dark:text-red-300">
              {node.description}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {t("emvTlv.length")}: {node.length}
          </span>
        </div>
        {!node.children && (
          <div className="flex flex-col gap-1">
            <div className="font-mono text-xs text-foreground break-all">
              {t("emvTlv.valueHex")}: {node.valueHex}
            </div>
            {node.printable && (
              <div className="text-xs text-foreground">
                {t("emvTlv.printable")}:{" "}
                <span className="font-mono">{node.printable}</span>
              </div>
            )}
          </div>
        )}
        {node.children && (
          <div className="mt-1 ml-3 flex flex-col gap-1">
            {node.children.map((child, idx) => (
              <EmvTlvRow key={`${node.tag}-${idx}`} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmvTlvDecoder() {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [demoTooltipOpen, setDemoTooltipOpen] = useState(false);
  const hasAutoShownTooltip = useRef(false);

  useEffect(() => {
    if (hasAutoShownTooltip.current) return;
    hasAutoShownTooltip.current = true;
    setDemoTooltipOpen(true);
    const timer = setTimeout(() => setDemoTooltipOpen(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  const nodes = useMemo(() => decodeEmvTlv(input), [input]);

  const handleDemo = useCallback(() => {
    const random =
      DEMO_SAMPLES[Math.floor(Math.random() * DEMO_SAMPLES.length)];
    setInput(random ?? DEMO_SAMPLES[0] ?? "");
    setDemoTooltipOpen(false);
  }, []);

  const handleCopy = useCallback(() => {
    if (!input.trim()) return;
    void navigator.clipboard.writeText(input.replace(/\s+/g, ""));
  }, [input]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("emvTlv.inputLabel")}
        </label>
        <textarea
          value={input}
          onChange={handleChange}
          placeholder={t("emvTlv.inputPlaceholder")}
          className={cn(
            "min-h-[120px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          )}
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip open={demoTooltipOpen} onOpenChange={setDemoTooltipOpen}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDemo}
              >
                <FileText className="size-4 shrink-0" />
                {t("emvTlv.demo")}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-[260px]">
              {t("emvTlv.demoTooltip")}
            </TooltipContent>
          </Tooltip>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopy}
          >
            <Copy className="size-4 shrink-0" />
            {t("emvTlv.copyHex")}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-2">
          {t("emvTlv.treeTitle")}
        </h3>
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 max-h-[420px] overflow-auto text-sm">
          {nodes.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground text-center">
              {t("emvTlv.noData")}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {nodes.map((node, idx) => (
                <EmvTlvRow key={`${node.tag}-${idx}`} node={node} depth={0} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

