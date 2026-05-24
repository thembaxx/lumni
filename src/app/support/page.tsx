"use client";

import {
	HeadphonesIcon,
	Mail01Icon,
	Message01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePremium } from "@/lib/premium/premium-context";

const SUPPORT_CHANNELS = [
	{
		icon: Mail01Icon,
		label: "Email Support",
		priority: "Get back to you within 4 hours",
		standard: "Get back to you within 24 hours",
		action: "mailto:support@lumni.app",
	},
	{
		icon: Message01Icon,
		label: "In-App Chat",
		priority: "Priority queue — instant response",
		standard: "Standard queue — response within 1 hour",
		action: "/chat",
	},
	{
		icon: HeadphonesIcon,
		label: "Knowledge Base",
		priority: "Available to all users",
		standard: "Available to all users",
		action: "https://help.lumni.app",
	},
];

export default function SupportPage() {
	const { hasFeature } = usePremium();
	const isPriority = hasFeature("priority-support");

	return (
		<PageContainer className="flex min-h-dvh flex-col gap-6 bg-background py-6">
			<div>
				<h1 className="font-semibold text-2xl">
					{isPriority ? "Priority Support" : "Support"}
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					{isPriority
						? "You have priority access — we'll get back to you faster."
						: "We're here to help. Upgrade to Premium for priority support."}
				</p>
			</div>

			<div className="flex flex-col gap-4">
				{SUPPORT_CHANNELS.map((channel) => (
					<a key={channel.label} href={channel.action}>
						<Card className="transition-colors hover:bg-accent/5">
							<CardHeader className="flex flex-row items-center gap-3">
								<HugeiconsIcon
									icon={channel.icon}
									className="size-5 text-[--system-accent]"
								/>
								<CardTitle className="font-medium text-base">
									{channel.label}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-sm">
									{isPriority ? channel.priority : channel.standard}
								</p>
							</CardContent>
						</Card>
					</a>
				))}
			</div>
		</PageContainer>
	);
}
