"use client";

import { LottieWrapper } from "@/components/lottie/lottie-wrapper";
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
	icon,
	onSelect,
}: SessionIdleProps) {
	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
			<Card className="max-w-md w-full card-elevated p-6">
				<CardHeader className="text-center pb-4">
					<CardTitle className="text-2xl">{title}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								{icon ?? (
									<LottieWrapper
										animation="loading-lumni"
										className="size-16 mx-auto"
										loop
									/>
								)}
							</EmptyMedia>
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