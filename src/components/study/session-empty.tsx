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

interface SessionEmptyProps {
	subject: string;
	onGoBack: () => void;
}

export function SessionEmpty({ subject, onGoBack }: SessionEmptyProps) {
	return (
		<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
			<div className="col-span-12 col-start-1 flex items-center justify-center p-4 md:col-span-7">
				<Card className="mx-auto w-full max-w-md">
					<CardHeader>
						<CardTitle>No Content</CardTitle>
					</CardHeader>
					<CardContent>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<m.div
										animate={{ scale: [1, 1.2, 1] }}
										transition={{ duration: 1.5, repeat: Infinity }}
									>
										<HugeiconsIcon
											icon={Search01Icon}
											className="mx-auto size-16 text-muted-foreground"
										/>
									</m.div>
								</EmptyMedia>
								<EmptyTitle>No content found</EmptyTitle>
								<EmptyDescription>
									Upload questions for {subject} to start studying
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
			<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
				<div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-destructive/10 blur-2xl" />
				</div>
			</div>
		</div>
	);
}
