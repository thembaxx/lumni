"use client";

import { LottieWrapper } from "@/components/lottie/lottie-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

interface FlashcardsEmptyProps {
	subject: string;
	onGoBack: () => void;
}

export function FlashcardsEmpty({ subject, onGoBack }: FlashcardsEmptyProps) {
	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardHeader className="text-center">
					<CardTitle>No Flashcards</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Empty>
						<EmptyHeader>
							<EmptyMedia>
								<LottieWrapper
									animation="empty-search"
									className="w-20 h-20 mx-auto"
									loop
								/>
							</EmptyMedia>
							<EmptyTitle>No flashcards found</EmptyTitle>
							<EmptyDescription>
								Upload questions for {subject} to study
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
					<Button variant="outline" className="w-full" onClick={onGoBack}>
						Go Back
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
