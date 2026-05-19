"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
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
		<div className="grid min-h-[100dvh] grid-cols-12 gap-0 bg-background">
			<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
				<Card className="mx-auto w-full max-w-md p-6">
					<CardHeader className="px-0 pt-0 pb-4">
						<CardTitle className="font-extrabold text-2xl tracking-tight">
							{title}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-6 px-0 pb-0">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									{icon ?? (
										<motion.div
											animate={{ rotate: 360 }}
											transition={{
												duration: 1,
												repeat: Infinity,
												ease: "linear",
											}}
										>
											<HugeiconsIcon
												icon={RadialIcon}
												className="mx-auto size-16 text-muted-foreground"
											/>
										</motion.div>
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
			<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
				<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-[--system-accent]/10 blur-2xl" />
				</div>
			</div>
		</div>
	);
}
