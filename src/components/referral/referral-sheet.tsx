"use client";

import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";
import Tick01Icon from "@hugeicons/core-free-icons/Tick01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useReferral } from "@/hooks/use-referral";
import { copyToClipboard, generateQRDataUrl, shareReferral } from "@/lib/referral/client";

export function ReferralSheet() {
  const [open, setOpen] = useState(false);
  const { info, isLoading } = useReferral();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(info?.code ?? "");
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (info) await shareReferral(info.link, info.code);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex h-11 items-center justify-start gap-2.5 rounded-card-lg border border-border/80 bg-secondary/80 px-5 text-foreground transition-colors hover:border-accent hover:bg-accent">
        <HugeiconsIcon icon={Share07Icon} className="size-4 text-accent" />
        <span className="font-medium text-sm">Invite Friend</span>
      </SheetTrigger>
      <SheetContent className="h-dvh w-full rounded-t-none px-4 sm:max-w-135" side="bottom">
        <SheetHeader className="text-left">
          <SheetTitle>Invite a Friend</SheetTitle>
          <SheetDescription>Share Lumni and earn rewards together</SheetDescription>
        </SheetHeader>

        <div className="flex max-h-[calc(100dvh-var(--spacing-safe-pt))] grow flex-col gap-6 overflow-y-auto px-4 pt-2 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-sm">Loading…</p>
            </div>
          ) : info ? (
            <>
              {/* Code Display */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border/40 bg-secondary/20 p-5">
                <p className="font-medium text-muted-foreground text-xs">Your referral code</p>
                <div className="select-all font-bold font-mono text-foreground text-xl tracking-wider">
                  {info.code}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 font-medium text-accent text-xs hover:underline"
                >
                  <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} className="size-3.5" />
                  {copied ? "Copied!" : "Tap to copy"}
                </button>
              </div>

              {/* Share Button */}
              <Button className="h-12 w-full gap-2 rounded-xl" onClick={handleShare}>
                <HugeiconsIcon icon={Share07Icon} className="size-4" />
                Share Invite Link
              </Button>

              {/* QR Code */}
              <div className="flex justify-center">
                <Image
                  src={generateQRDataUrl(info.link)}
                  alt="QR Code"
                  width={128}
                  height={128}
                  unoptimized
                  className="size-32 rounded-lg border border-border/30 outline outline-black/10 -outline-offset-1 dark:outline-white/10"
                />
              </div>

              {/* How It Works */}
              <div className="flex flex-col gap-3 rounded-xl border border-border/20 bg-secondary/10 p-4">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  How it works
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <p>1. Share your code or link with a friend</p>
                  <p>2. They sign up and verify their email</p>
                  <p>3. You both get {info.rewardDays} days of Premium free</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-6 text-center">
                <div>
                  <p className="font-bold text-lg">{info.referrals.length}</p>
                  <p className="text-muted-foreground text-xs">Sent</p>
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {info.referrals.filter((r) => r.status === "rewarded").length}
                  </p>
                  <p className="text-muted-foreground text-xs">Earned</p>
                </div>
                <div>
                  <p className="font-bold text-lg">{info.monthlyLimit - info.monthlyCount}</p>
                  <p className="text-muted-foreground text-xs">Left this month</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-sm">Could not load referral info</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
