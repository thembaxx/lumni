"use client";

import { Card, CardContent } from "@/components/ui/card";

export function FlashcardsLoading() {
	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardContent className="p-8 text-center">
					<p className="text-muted-foreground">Loading flashcards...</p>
				</CardContent>
			</Card>
		</div>
	);
}
