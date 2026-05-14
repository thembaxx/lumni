"use client";

import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { LottieWrapper } from "@/components/lottie/lottie-wrapper";
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
		<div className="min-h-[100dvh] bg-background grid grid-cols-12 gap-0">
			<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
				<Card className="max-w-md w-full mx-auto p-6">
					<CardHeader className="px-0 pt-0 pb-4">
						<CardTitle className="text-2xl font-extrabold tracking-tight">
							{title}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-6 px-0 pb-0">
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
			<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
				<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-[--system-accent]/10 blur-2xl animate-float-slow" />
				</div>
			</div>
		</div>
	);
}
