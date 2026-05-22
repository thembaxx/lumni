"use client";

import { AlertCircleIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/shared";

interface DangerZoneProps extends React.ComponentProps<typeof Card> {
	onDeleteAccount: () => Promise<void>;
	onClearData: () => Promise<void>;
}

export function DangerZone({
	onDeleteAccount,
	onClearData,
	className,
	...props
}: DangerZoneProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [isClearing, setIsClearing] = useState(false);

	return (
		<Card className={cn("border-destructive/50", className)} {...props}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 font-heading text-base text-destructive">
					<HugeiconsIcon icon={AlertCircleIcon} size={20} />
					Danger Zone
				</CardTitle>
				<CardDescription>
					Irreversible actions. Proceed with caution.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<Dialog>
					<DialogTrigger>
						<Button
							variant="outline"
							size="sm"
							className="w-fit border-destructive/50 text-destructive hover:bg-destructive/10"
						>
							Clear All Local Data
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Clear all local data?</DialogTitle>
							<DialogDescription>
								This will remove flashcards, notes, and offline content from
								this device. Your Appwrite data will remain.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="destructive"
								onClick={async () => {
									setIsClearing(true);
									await onClearData();
									setIsClearing(false);
								}}
								disabled={isClearing}
							>
								{isClearing ? "Clearing..." : "Clear Data"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog>
					<DialogTrigger>
						<Button variant="destructive" size="sm" className="w-fit">
							<HugeiconsIcon icon={Delete02Icon} size={16} />
							Delete Account
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete your account?</DialogTitle>
							<DialogDescription>
								This action cannot be undone. All your data will be permanently
								removed.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="destructive"
								onClick={async () => {
									setIsDeleting(true);
									await onDeleteAccount();
									setIsDeleting(false);
								}}
								disabled={isDeleting}
							>
								{isDeleting ? "Deleting..." : "Permanently Delete Account"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	);
}
