"use client";

import { Lightbulb } from "lucide-react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
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

interface FlashcardsIdleProps {
	onSelect: (subject: string) => void;
}

export function FlashcardsIdle({ onSelect }: FlashcardsIdleProps) {
	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Flashcards</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Lightbulb className="size-8" />
							</EmptyMedia>
							<EmptyTitle>Start Learning</EmptyTitle>
							<EmptyDescription>
								Select a subject to study with flashcards
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<SubjectsDrawer onSelect={onSelect}>
								<Button>Choose Subject</Button>
							</SubjectsDrawer>
						</EmptyContent>
					</Empty>
				</CardContent>
			</Card>
		</div>
	);
}
