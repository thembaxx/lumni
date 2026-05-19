"use client";

import {
	Copy01Icon,
	Share07Icon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import {
	copyToClipboard,
	generateQRDataUrl,
	shareReferral,
} from "@/lib/referral/client";

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
			<SheetTrigger className="h-11 px-5 rounded-[2.5rem] border border-border/80 bg-secondary/80 gap-2.5 inline-flex items-center justify-start text-foreground hover:bg-accent hover:border-accent transition-colors">
				<HugeiconsIcon icon={Share07Icon} className="size-4 text-accent" />
				<span className="text-sm font-medium">Invite Friend</span>
			</SheetTrigger>
			<SheetContent
				className="sm:max-w-135 w-full h-dvh px-4 rounded-t-none"
				side="bottom"
			>
				<SheetHeader className="text-left">
					<SheetTitle>Invite a Friend</SheetTitle>
					<SheetDescription>
						Share Lumni and earn rewards together
					</SheetDescription>
				</SheetHeader>

				<div className="px-4 pb-4 grow max-h-[95dvh] overflow-y-auto flex flex-col gap-6 pt-2">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<p className="text-sm text-muted-foreground">Loading...</p>
						</div>
					) : info ? (
						<>
							{/* Code Display */}
							<div className="flex flex-col items-center gap-3 bg-secondary/20 rounded-xl p-5 border border-border/40">
								<p className="text-xs text-muted-foreground font-medium">
									Your referral code
								</p>
								<div className="text-xl font-mono font-bold tracking-wider text-foreground select-all">
									{info.code}
								</div>
								<button
									onClick={handleCopy}
									className="flex items-center gap-1.5 text-xs text-accent font-medium hover:underline"
								>
									<HugeiconsIcon
										icon={copied ? Tick01Icon : Copy01Icon}
										className="size-3.5"
									/>
									{copied ? "Copied!" : "Tap to copy"}
								</button>
							</div>

							{/* Share Button */}
							<Button
								className="w-full h-12 rounded-xl gap-2"
								onClick={handleShare}
							>
								<HugeiconsIcon icon={Share07Icon} className="size-4" />
								Share Invite Link
							</Button>

							{/* QR Code */}
							<div className="flex justify-center">
								{/* biome-ignore lint/performance/noImgElement: external QR code API */}
								<img
									src={generateQRDataUrl(info.link)}
									alt="QR Code"
									className="size-32 rounded-lg border border-border/30"
								/>
							</div>

							{/* How It Works */}
							<div className="flex flex-col gap-3 bg-secondary/10 rounded-xl p-4 border border-border/20">
								<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
									<p className="text-lg font-bold">{info.referrals.length}</p>
									<p className="text-xs text-muted-foreground">Sent</p>
								</div>
								<div>
									<p className="text-lg font-bold">
										{
											info.referrals.filter((r) => r.status === "rewarded")
												.length
										}
									</p>
									<p className="text-xs text-muted-foreground">Earned</p>
								</div>
								<div>
									<p className="text-lg font-bold">
										{info.monthlyLimit - info.monthlyCount}
									</p>
									<p className="text-xs text-muted-foreground">
										Left this month
									</p>
								</div>
							</div>
						</>
					) : (
						<div className="flex items-center justify-center py-12">
							<p className="text-sm text-muted-foreground">
								Could not load referral info
							</p>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
