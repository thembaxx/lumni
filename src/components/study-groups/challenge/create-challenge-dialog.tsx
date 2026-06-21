"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { ChallengeType } from "@/lib/study-groups/challenge-types";
import {
	CHALLENGE_TYPE_ICONS,
	CHALLENGE_TYPE_LABELS,
} from "@/lib/study-groups/challenge-types";

interface Props {
	groupId: string;
	onCreated?: () => void;
}

const CHALLENGE_TYPES: ChallengeType[] = [
	"most-quizzes",
	"highest-accuracy",
	"most-flashcards",
];

export function CreateChallengeDialog({ groupId, onCreated }: Props) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleCreate = async (type: ChallengeType) => {
		setLoading(true);
		try {
			await apiFetch(`/api/study-groups/${groupId}/challenge`, {
				method: "POST",
				body: JSON.stringify({ challengeType: type }),
				headers: { "Content-Type": "application/json" },
			});
			toast({
				type: "success",
				message: `${CHALLENGE_TYPE_LABELS[type]} challenge created!`,
			});
			setOpen(false);
			onCreated?.();
		} catch {
			toast({ type: "error", message: "Failed to create challenge" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>
				New Challenge
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Group Challenge</DialogTitle>
					<DialogDescription>
						Choose a challenge type for your group this week.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					{CHALLENGE_TYPES.map((type) => (
						<Button
							key={type}
							variant="outline"
							className="flex h-auto items-center gap-3 px-4 py-3"
							onClick={() => handleCreate(type)}
							disabled={loading}
						>
							<span className="text-lg">{CHALLENGE_TYPE_ICONS[type]}</span>
							<div className="flex flex-col items-start gap-0.5">
								<span className="font-medium text-sm">
									{CHALLENGE_TYPE_LABELS[type]}
								</span>
							</div>
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
