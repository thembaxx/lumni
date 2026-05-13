"use client";

import { Button } from "@/components/ui/button";
import { LottieWrapper } from "@/components/lottie/lottie-wrapper";
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
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardHeader className="text-center">
					<CardTitle>No Content</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<LottieWrapper
								animation="empty-search"
								className="size-16 mx-auto"
								loop
							/>
						</EmptyMedia>
						<EmptyTitle>No content found</EmptyTitle>
						<EmptyDescription>
							Upload questions for {subject} to start studying
						</EmptyDescription>
					</EmptyHeader>
					</Empty>
					<Button variant="outline" className="w-full" onClick={onGoBack}>
						Go Back
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
