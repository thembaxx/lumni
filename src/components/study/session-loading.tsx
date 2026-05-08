"use client";

import { LottieWrapper } from "@/components/lottie";
import { Card, CardContent } from "@/components/ui/card";

interface SessionLoadingProps {
	useLottie?: boolean;
}

export function SessionLoading({ useLottie = false }: SessionLoadingProps) {
	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardContent className="p-8 text-center">
					{useLottie ? (
						<LottieWrapper
							animation="loading-lumni"
							className="w-24 h-24 mx-auto"
							loop
						/>
					) : (
						<p className="text-muted-foreground">Loading...</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
