"use client";

import {
	AlertCircleIcon,
	CheckmarkCircle01Icon,
	Clock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Anim } from "@/components/shared/anim";
import { iOSEase } from "@/lib/utils/animation";
import { SuccessBadge } from "../success-badge";

interface SuccessStateProps {
	email: string;
	error: string;
}

export function SuccessState({ email, error }: SuccessStateProps) {
	return (
		<Anim>
			<m.div
				className="flex flex-col items-center gap-4 py-4"
				initial={{ opacity: 0, y: 10 }}
				animate={{
					opacity: 1,
					y: 0,
					transition: {
						duration: 0.3,
						ease: iOSEase,
					},
				}}
			>
				<div className="relative">
					<m.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{
							scale: 1,
							opacity: 1,
							transition: {
								type: "spring",
								stiffness: 350,
								damping: 26,
							},
						}}
					>
						<div className="rounded-full bg-success/10 p-4">
							<HugeiconsIcon
								icon={CheckmarkCircle01Icon}
								className="size-12 text-success"
							/>
						</div>
					</m.div>
					<SuccessBadge isAdmin={false} />
				</div>

				<div className="flex flex-col gap-2 text-center">
					<p className="font-medium text-foreground text-lg">
						Magic link sent!
					</p>
					<p className="text-muted-foreground text-sm">
						We&apos;ve sent a sign-in link to:{" "}
						<span className="font-medium">{email}</span>
					</p>
				</div>

				<m.div
					className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-2"
					initial={{ opacity: 0, y: 6 }}
					animate={{
						opacity: 1,
						y: 0,
						transition: {
							duration: 0.3,
							delay: 0.12,
							ease: iOSEase,
						},
					}}
				>
					<p className="flex items-center gap-2 text-sm text-warning-foreground">
						<HugeiconsIcon icon={Clock01Icon} className="size-4" />
						<span className="font-medium">Link expires in 15 minutes</span>
					</p>
				</m.div>

				{error && (
					<p className="flex items-center gap-1 text-destructive text-xs">
						<HugeiconsIcon icon={AlertCircleIcon} className="size-3" />
						{error}
					</p>
				)}
			</m.div>
		</Anim>
	);
}
