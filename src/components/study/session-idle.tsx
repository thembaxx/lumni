"use client";

import { Target } from "lucide-react";
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

interface SessionIdleProps {
	title?: string;
	description?: string;
	icon?: React.ReactNode;
	onSelect?: (subject: string) => void;
}

export function SessionIdle({
	title = "Start Learning",
	description = "Select a subject to begin studying",
	icon = <Target className="size-8" />,
	onSelect,
}: SessionIdleProps) {
	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">{title}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">{icon}</EmptyMedia>
							<EmptyTitle>{title}</EmptyTitle>
							<EmptyDescription>{description}</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							{onSelect && (
								<SubjectsDrawer onSelect={onSelect}>
									<Button>Choose Subject</Button>
								</SubjectsDrawer>
							)}
						</EmptyContent>
					</Empty>
				</CardContent>
			</Card>
		</div>
	);
}
