"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseHexBitmap, bitsToHex } from "@/lib/iso8583-bitmap";
import {
  buildIso8583Message,
  getSetDeNumbers,
  DE_SPECS,
} from "@/lib/iso8583-message";
import { cn } from "@/lib/utils";

const COLS = 4;

/** Khoảng 10 dữ liệu demo (16 hoặc 32 ký tự hex) để random khi nhấn Demo. */
const DEMO_BITMAPS = [
  "B2200000000000018000000000000000",
  "8000000000000001",
  "C000000000000001",
  "FFFFFFFF00000000",
  "4200000000000000",
  "80000000000000018000000000000000",
  "F0F0F0F0F0F0F0F0",
  "1234567890ABCDEF",
  "0000000000000001",
  "E0000000000000018000000000000000",
];

export function Iso8583Bitmap() {
  const { t } = useLanguage();
  const [bitmapInput, setBitmapInput] = useState("");
  const [activeTab, setActiveTab] = useState<"first" | "second">("first");
  const [addedList, setAddedList] = useState<string[]>([]);
  const [demoTooltipOpen, setDemoTooltipOpen] = useState(false);
  const [mti, setMti] = useState("0200");
  const [deValues, setDeValues] = useState<Record<number, string>>({});
  const [builtMessage, setBuiltMessage] = useState("");
  const hasAutoShownTooltip = useRef(false);

  useEffect(() => {
    if (hasAutoShownTooltip.current) return;
    hasAutoShownTooltip.current = true;
    setDemoTooltipOpen(true);
    const timer = setTimeout(() => setDemoTooltipOpen(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  const bits = useMemo(() => parseHexBitmap(bitmapInput), [bitmapInput]);

  const bitmapHex = useMemo(
    () => bitmapInput.replace(/\s/g, "").toUpperCase(),
    [bitmapInput]
  );
  const isValidBitmap =
    bitmapHex.length === 16 || bitmapHex.length === 32;
  const setDeNumbers = useMemo(
    () => (isValidBitmap ? getSetDeNumbers(bitmapHex) : []),
    [isValidBitmap, bitmapHex]
  );
  const deNumbersForBuilder = useMemo(
    () => setDeNumbers.filter((de) => de !== 1),
    [setDeNumbers]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9A-Fa-f\s]/g, "").slice(0, 32);
    setBitmapInput(v);
  };

  const handleBitToggle = useCallback((bitIndex: number, checked: boolean) => {
    const next = [...bits];
    next[bitIndex] = checked;
    const includeSecond = bitIndex >= 64 || next.slice(64).some(Boolean);
    setBitmapInput(bitsToHex(next, includeSecond));
  }, [bits]);

  const handleClear = useCallback(() => {
    setBitmapInput("");
    setAddedList([]);
    setDeValues({});
    setBuiltMessage("");
  }, []);

  const handleDeValueChange = useCallback((deNum: number, value: string) => {
    setDeValues((prev) => ({ ...prev, [deNum]: value }));
  }, []);

  const handleBuildMessage = useCallback(() => {
    if (!isValidBitmap) return;
    const msg = buildIso8583Message(mti, bitmapHex, deValues);
    setBuiltMessage(msg);
  }, [mti, bitmapHex, deValues, isValidBitmap]);

  const handleCopyMessage = useCallback(async () => {
    if (!builtMessage) return;
    await navigator.clipboard.writeText(builtMessage);
  }, [builtMessage]);

  const handleAdd = useCallback(() => {
    const trimmed = bitmapInput.replace(/\s/g, "").toUpperCase();
    if (trimmed.length !== 16 && trimmed.length !== 32) return;
    setAddedList((prev) => [...prev, trimmed]);
  }, [bitmapInput]);

  const handleDemo = useCallback(() => {
    const random =
      DEMO_BITMAPS[Math.floor(Math.random() * DEMO_BITMAPS.length)];
    setBitmapInput(random ?? DEMO_BITMAPS[0] ?? "");
    setDemoTooltipOpen(false);
  }, []);

  const renderBitGrid = (startBit: number, endBit: number) => {
    const items = [];
    for (let i = startBit; i <= endBit; i++) {
      const bitNum = i + 1;
      const label = `Bit ${String(bitNum).padStart(3, "0")}`;
      items.push(
        <label
          key={i}
          className={cn(
            "flex items-center gap-2 rounded border border-transparent py-1.5 px-2 hover:bg-muted/50 cursor-pointer"
          )}
        >
          <input
            type="checkbox"
            checked={bits[i]}
            onChange={(e) => handleBitToggle(i, e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </label>
      );
    }
    return (
      <div className="grid grid-cols-4 gap-x-4 gap-y-0.5">
        {items}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("iso8583.bitmap")}
        </label>
        <Input
          value={bitmapInput}
          onChange={handleInputChange}
          placeholder={t("iso8583.bitmapPlaceholder")}
          className="font-mono"
          maxLength={33}
        />
      </div>

      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("first")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "first"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("iso8583.firstBitmap")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("second")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "second"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("iso8583.secondBitmap")}
        </button>
      </div>

      <div className="min-h-[280px]">
        {activeTab === "first" && renderBitGrid(0, 63)}
        {activeTab === "second" && renderBitGrid(64, 127)}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tooltip open={demoTooltipOpen} onOpenChange={setDemoTooltipOpen}>
          <TooltipTrigger asChild>
            <Button type="button" variant="outline" onClick={handleDemo}>
              {t("iso8583.demo")}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6} className="max-w-[240px]">
            {t("iso8583.demoTooltip")}
          </TooltipContent>
        </Tooltip>
        <Button type="button" variant="outline" onClick={handleClear}>
          {t("iso8583.clear")}
        </Button>
        <Button type="button" onClick={handleAdd}>
          {t("iso8583.add")}
        </Button>
      </div>

      {addedList.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">
            {t("iso8583.addedList")} ({addedList.length})
          </h4>
          <ul className="flex flex-wrap gap-2">
            {addedList.map((hex, i) => (
              <li
                key={`${i}-${hex}`}
                className="font-mono text-sm px-2 py-1 rounded bg-background border border-border"
              >
                {hex}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Message Builder */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {t("iso8583.messageBuilder")}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("iso8583.messageBuilderDesc")}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">
              {t("iso8583.mti")}
            </label>
            <Input
              value={mti}
              onChange={(e) => setMti(e.target.value.slice(0, 4))}
              placeholder={t("iso8583.mtiPlaceholder")}
              className="font-mono mt-1"
              maxLength={4}
            />
          </div>
        </div>
        {isValidBitmap && deNumbersForBuilder.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              {t("iso8583.dataElementsCount")} ({deNumbersForBuilder.length})
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              {deNumbersForBuilder.map((deNum) => {
                const spec = DE_SPECS[deNum];
                const label = spec
                  ? `DE${deNum} - ${spec.name}`
                  : `DE${deNum}`;
                return (
                  <div key={deNum} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground truncate">
                      {label}
                    </label>
                    <Input
                      value={deValues[deNum] ?? ""}
                      onChange={(e) =>
                        handleDeValueChange(deNum, e.target.value)
                      }
                      placeholder={t("iso8583.deValuePlaceholder")}
                      className="font-mono text-sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {!isValidBitmap && (
          <p className="text-sm text-muted-foreground">
            {t("iso8583.bitmapRequiredHint")}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleBuildMessage}
            disabled={!isValidBitmap}
          >
            {t("iso8583.buildMessage")}
          </Button>
          {builtMessage && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyMessage}
              >
                {t("iso8583.copyMessage")}
              </Button>
            </>
          )}
        </div>
        {builtMessage && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              {t("iso8583.messageOutput")}
            </label>
            <textarea
              readOnly
              value={builtMessage}
              className="w-full min-h-[80px] rounded-md border border-input bg-muted/30 px-3 py-2 font-mono text-sm"
              rows={4}
            />
          </div>
        )}
      </div>
    </div>
  );
}
