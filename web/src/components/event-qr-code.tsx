"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const GUEST_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function EventQrCode({ slug, eventName }: { slug: string; eventName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const guestUrl = `${GUEST_APP_URL}/e/${slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${slug}-qr-code.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest QR code</CardTitle>
        <CardDescription>
          Print this or display it at {eventName} — guests scan it to upload photos, no app or
          account needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <QRCodeCanvas ref={canvasRef} value={guestUrl} size={220} level="M" marginSize={0} />
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <code className="w-full break-all rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
            {guestUrl}
          </code>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy link"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              Download PNG
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
