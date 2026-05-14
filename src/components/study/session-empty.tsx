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

interface SessionEmptyProps {
	subject: string;
	onGoBack: () => void;
}

export function SessionEmpty({ subject, onGoBack }: SessionEmptyProps) {
	return (
		<div className="min-h-[100dvh] bg-background grid grid-cols-12 gap-0">
			<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4">
				<Card className="max-w-md w-full mx-auto">
					<CardHeader>
						<CardTitle>No Content</CardTitle>
					</CardHeader>
					<CardContent>
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<motion.div
										animate={{ scale: [1, 1.2, 1] }}
										transition={{ duration: 1.5, repeat: Infinity }}
									>
										<MagnifyingGlass className="size-16 mx-auto text-muted-foreground" />
									</motion.div>
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
			<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
				<div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-destructive/10 blur-2xl animate-float-slow" />
				</div>
			</div>
		</div>
	);
}