"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FlashcardsEmptyProps {
	subject: string;
	onGoBack: () => void;
	mode?: "ai" | "mistakes";
}

export function FlashcardsEmpty({
	subject,
	onGoBack,
	mode,
}: FlashcardsEmptyProps) {
	const message =
		mode === "mistakes"
			? `No past mistakes found for ${subject}. Complete some quizzes first!`
			: `Upload some ${subject} questions to start studying and ace that exam!`;

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle>Deck is Empty</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<m.div
									animate={{ scale: [1, 1.2, 1] }}
									transition={{ duration: 1.5, repeat: Infinity }}
								>
									<HugeiconsIcon
										icon={Search01Icon}
										className="mx-auto size-10 text-muted-foreground"
									/>
								</m.div>
							</EmptyMedia>
							<EmptyTitle>No flashcards found</EmptyTitle>
							<EmptyDescription>{message}</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button variant="outline" className="w-full" onClick={onGoBack}>
								Go Back
							</Button>
						</EmptyContent>
					</Empty>
				</CardContent>
			</Card>
		</div>
	);
}
