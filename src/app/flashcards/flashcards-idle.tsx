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
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface FlashcardsIdleProps {
	onSelect: (subject: string) => void;
}

export function FlashcardsIdle({ onSelect }: FlashcardsIdleProps) {
	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
			<Card className="max-w-md w-full card-elevated p-6">
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
								<Button>
									Choose Subject
									<HugeiconsIcon
										icon={ArrowDown01Icon}
										className="w-4 h-4 ml-1" />
								</Button>
							</SubjectsDrawer>
						</EmptyContent>
					</Empty>
				</CardContent>
			</Card>
		</div>
	);
}
