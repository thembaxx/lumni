"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
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
							<EmptyMedia variant="icon">
								<motion.div
									animate={{ scale: [1, 1.2, 1] }}
									transition={{ duration: 1.5, repeat: Infinity }}
								>
									<MagnifyingGlass className="size-10 mx-auto text-muted-foreground" />
								</motion.div>
							</EmptyMedia>
							<EmptyTitle>No flashcards found</EmptyTitle>
							<EmptyDescription>
								Upload questions for {subject} to study
							</EmptyDescription>
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
