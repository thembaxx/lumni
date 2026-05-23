"use client";

import { Mail01Icon, SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ParentInvitationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	studentName: string;
	onSend: (
		parentEmail: string,
		canViewProgress: boolean,
		canViewScores: boolean,
	) => Promise<void>;
}

export function ParentInvitationDialog({
	open,
	onOpenChange,
	studentName,
	onSend,
}: ParentInvitationDialogProps) {
	const [email, setEmail] = useState("");
	const [canViewProgress, setCanViewProgress] = useState(true);
	const [canViewScores, setCanViewScores] = useState(true);
	const [isSending, setIsSending] = useState(false);

	const handleSend = async () => {
		if (!email.trim()) return;
		setIsSending(true);
		try {
			await onSend(email.trim(), canViewProgress, canViewScores);
			setEmail("");
			onOpenChange(false);
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<HugeiconsIcon icon={Mail01Icon} size={20} />
						Invite Parent/Guardian
					</DialogTitle>
					<DialogDescription>
						Send an invitation to view {studentName}&apos;s study progress.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="parent-email">Parent/Guardian Email</Label>
						<Input
							id="parent-email"
							type="email"
							placeholder="parent@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<p className="font-medium text-sm">Permissions</p>
						<div className="flex items-center gap-2">
							<Checkbox
								id="view-progress"
								checked={canViewProgress}
								onCheckedChange={(checked) =>
									setCanViewProgress(checked === true)
								}
							/>
							<Label htmlFor="view-progress" className="font-normal text-sm">
								Can view study progress and streaks
							</Label>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox
								id="view-scores"
								checked={canViewScores}
								onCheckedChange={(checked) =>
									setCanViewScores(checked === true)
								}
							/>
							<Label htmlFor="view-scores" className="font-normal text-sm">
								Can view quiz scores and weak areas
							</Label>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSend} disabled={!email.trim() || isSending}>
						<HugeiconsIcon icon={SentIcon} size={16} />
						{isSending ? "Sending..." : "Send Invitation"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
