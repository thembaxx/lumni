"use client";

import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";
import Tick01Icon from "@hugeicons/core-free-icons/Tick01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useState } from "react";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { useReferral } from "@/hooks/use-referral";
import { copyToClipboard, generateQRDataUrl, shareReferral } from "@/lib/referral/client";

const copyLeading = <HugeiconsIcon icon={Copy01Icon} className="size-4" />;
const copiedLeading = <HugeiconsIcon icon={Tick01Icon} className="size-4" />;
const shareLeading = <HugeiconsIcon icon={Share07Icon} className="size-4" />;

export function ReferralTab() {
  const { info, isLoading } = useReferral();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground text-sm">Could not load referral info</p>
      </div>
    );
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(info.code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyIcon = copied ? copiedLeading : copyLeading;

  const handleShare = async () => {
    await shareReferral(info.link, info.code);
  };

  const pendingCount = info.referrals.filter((r) => r.status === "pending").length;
  const rewardedCount = info.referrals.filter((r) => r.status === "rewarded").length;

  return (
    <div className="flex flex-col gap-6">
      <ListSection
        header="Your Referral Code"
        footer="Share this code with friends to earn rewards"
      >
        <div className="flex flex-col items-center gap-4 px-5 py-6">
          <div className="select-all rounded-xl border border-border/40 bg-secondary/30 px-6 py-3 font-bold font-mono text-2xl text-foreground tracking-wider">
            {info.code}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span>Sent: {info.referrals.length}</span>
            <span className="opacity-30">|</span>
            <span>Earned: {rewardedCount}</span>
            <span className="opacity-30">|</span>
            <span>Pending: {pendingCount}</span>
          </div>
        </div>

        <ListCell
          title={copied ? "Copied!" : "Copy Code"}
          leading={copyIcon}
          onClick={handleCopy}
          showSeparator
        />

        <ListCell
          title="Share Invite Link"
          leading={shareLeading}
          onClick={handleShare}
          showSeparator={false}
        />
      </ListSection>

      {/* QR Code Section */}
      <ListSection header="Share via QR Code">
        <div className="flex justify-center py-6">
          <Image
            src={generateQRDataUrl(info.link)}
            alt="Referral QR Code"
            width={160}
            height={160}
            unoptimized
            className="size-40 rounded-xl border border-border/40 outline outline-black/10 -outline-offset-1 dark:outline-white/10"
          />
        </div>
      </ListSection>

      {/* How It Works */}
      <ListSection
        header="How It Works"
        footer={`${info.rewardDays} days of Premium per verified referral. Max ${info.monthlyLimit} referrals/month.`}
      >
        <ListCell
          title="1. Share your code or link"
          subtitle="Send it via WhatsApp, email, or in person"
          showSeparator
        />
        <ListCell
          title="2. Friend signs up"
          subtitle="They create an account using your code"
          showSeparator
        />
        <ListCell
          title="3. Both get Premium"
          subtitle={`You and your friend each get ${info.rewardDays} days free`}
          showSeparator={false}
        />
      </ListSection>

      {/* Reward History */}
      {info.referrals.length > 0 && (
        <ListSection header="Reward History">
          {info.referrals.map((r, i) => (
            <ListCell
              key={r.refereeId}
              title={r.status === "rewarded" ? "✓ Premium earned" : "○ Pending verification"}
              subtitle={new Date(r.createdAt).toLocaleDateString()}
              showSeparator={i < info.referrals.length - 1}
            />
          ))}
        </ListSection>
      )}
    </div>
  );
}
