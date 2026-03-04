"use client";

import { useCallback, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { decodeJwt } from "@/lib/jwt-decode";
import { Copy } from "lucide-react";

function formatClaimKey(key: string): string {
  const labels: Record<string, string> = {
    exp: "exp",
    iat: "iat",
    nbf: "nbf",
    sub: "sub",
    aud: "aud",
    iss: "iss",
  };
  return labels[key] ?? key;
}

export function JwtDecoder() {
  const { t } = useLanguage();
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<ReturnType<typeof decodeJwt> | null>(
    null
  );

  const handleDecode = useCallback(() => {
    const res = decodeJwt(token);
    setDecoded(res);
  }, [token]);

  const handleClear = useCallback(() => {
    setToken("");
    setDecoded(null);
  }, []);

  const handleCopy = useCallback(
    async (obj: Record<string, unknown>) => {
      await navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    },
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {t("jwtDec.inputLabel")}
        </label>
        <textarea
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setDecoded(null);
          }}
          placeholder={t("jwtDec.inputPlaceholder")}
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          rows={4}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={handleDecode}>
          {t("jwtDec.decode")}
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          {t("jwtDec.clear")}
        </Button>
      </div>

      {decoded && (
        <div className="space-y-4">
          {!decoded.success && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                {decoded.error ?? t("jwtDec.invalidToken")}
              </p>
            </div>
          )}

          {decoded.success && decoded.header && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {t("jwtDec.header")}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(decoded.header!)}
                >
                  <Copy className="mr-1 h-4 w-4" />
                  {t("jwtDec.copyHeader")}
                </Button>
              </div>
              <pre className="mt-2 overflow-auto rounded bg-muted/50 p-3 text-xs font-mono">
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
            </div>
          )}

          {decoded.success && decoded.payload && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {t("jwtDec.payload")}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(decoded.payload!)}
                >
                  <Copy className="mr-1 h-4 w-4" />
                  {t("jwtDec.copyPayload")}
                </Button>
              </div>
              <div className="mt-2 space-y-1 rounded bg-muted/50 p-3 text-xs">
                {["exp", "iat", "nbf", "sub", "aud", "iss"].map(
                  (key) =>
                    decoded.payload![key] !== undefined && (
                      <div key={key} className="flex gap-2">
                        <span className="text-muted-foreground">
                          {formatClaimKey(key)}:
                        </span>
                        <span className="font-mono">
                          {key === "exp" || key === "iat" || key === "nbf"
                            ? typeof decoded.payload![key] === "number"
                              ? new Date(
                                  (decoded.payload![key] as number) * 1000
                                ).toISOString()
                              : String(decoded.payload![key])
                            : String(decoded.payload![key])}
                        </span>
                      </div>
                    )
                )}
              </div>
              <pre className="mt-2 overflow-auto text-xs font-mono">
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>
            </div>
          )}

          {decoded.success && decoded.signatureRaw && (
            <div className="rounded-lg border border-border bg-card p-4">
              <span className="text-sm font-semibold text-foreground">
                {t("jwtDec.signature")}
              </span>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {decoded.signatureRaw}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
