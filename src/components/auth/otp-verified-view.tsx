"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { SuccessBadge } from "./success-badge";

export function OtpVerifiedView() {
	return (
		<m.div
			className="flex flex-col items-center gap-4 py-8"
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{
				opacity: 1,
				scale: 1,
				transition: {
					type: "spring",
					stiffness: 300,
					damping: 20,
					delay: 0.05,
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
							damping: 18,
						},
					}}
				>
					<div className="rounded-full bg-success/20 p-6">
						<HugeiconsIcon
							icon={CheckmarkCircle01Icon}
							className="size-16 text-success"
						/>
					</div>
				</m.div>
				<SuccessBadge isAdmin={true} />
			</div>
			<p className="font-medium text-foreground text-lg">You&apos;re in!</p>
			<p className="animate-pulse text-muted-foreground text-sm">
				Redirecting…
			</p>
		</m.div>
	);
}
