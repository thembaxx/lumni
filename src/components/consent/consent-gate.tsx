"use client";

import ShieldCheck from "@hugeicons/core-free-icons/SecurityCheckIcon";
import UserCheck01Icon from "@hugeicons/core-free-icons/UserCheck01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ConsentStatusBadge } from "@/components/atoms/consent-status-badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ConsentGateProps extends React.ComponentProps<typeof Card> {
	studentName: string;
	parentEmail: string;
	status: "pending" | "granted" | "revoked";
	onGrant: () => Promise<void>;
	onRevoke: () => Promise<void>;
}

export function ConsentGate({
	studentName,
	parentEmail,
	status,
	onGrant,
	onRevoke,
	className,
	...props
}: ConsentGateProps) {
	const [agreed, setAgreed] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	if (status === "granted") {
		return (
			<Card
				className={cn("border-success/30 bg-success/5", className)}
				{...props}
			>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<HugeiconsIcon
							icon={ShieldCheck}
							size={20}
							className="text-success"
							aria-hidden="true"
						/>
						Parental Consent Active
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<p className="text-sm">
						{parentEmail} has permission to view {studentName}&apos;s progress.
					</p>
					<ConsentStatusBadge status="granted" />
					<Button
						variant="outline"
						size="sm"
						onClick={async () => {
							setIsProcessing(true);
							await onRevoke();
							setIsProcessing(false);
						}}
						disabled={isProcessing}
					>
						Revoke Consent
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={cn(className)} {...props}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<HugeiconsIcon
						icon={UserCheck01Icon}
						size={20}
						className="text-primary"
						aria-hidden="true"
					/>
					Parental Consent Required
				</CardTitle>
				<CardDescription>
					Before {parentEmail} can view {studentName}&apos;s progress, we need
					your consent.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<ConsentStatusBadge status={status} />
				<div className="flex flex-col gap-2">
					<p className="text-muted-foreground text-sm">
						By granting consent, you allow this parent/guardian to:
					</p>
					<ul className="list-disc pl-4 text-muted-foreground text-sm">
						<li>View study progress and streaks</li>
						<li>See quiz scores and weak areas</li>
						<li>Receive weekly summary reports</li>
					</ul>
				</div>
				<div className="flex items-start gap-2">
					<Checkbox
						id="consent-agree"
						checked={agreed}
						onCheckedChange={(checked) => setAgreed(checked === true)}
					/>
					<Label
						htmlFor="consent-agree"
						className="font-normal text-sm leading-relaxed"
					>
						I am the legal guardian of {studentName} and I consent to sharing
						their study data with {parentEmail}.
					</Label>
				</div>
				<Button
					onClick={async () => {
						setIsProcessing(true);
						await onGrant();
						setIsProcessing(false);
					}}
					disabled={!agreed || isProcessing}
					className="w-full"
				>
					{isProcessing ? "Processing…" : "Grant Consent"}
				</Button>
			</CardContent>
		</Card>
	);
}
