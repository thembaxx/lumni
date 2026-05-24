"use client";

import { Camera01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/hooks/use-onboarding";
import { offlineDB } from "@/lib/db/schema";
import { cn } from "@/lib/shared";
import { getImageHash, preprocessImage } from "@/lib/utils/image-preprocess";

interface ExtractionResult {
	solution: string;
	provider: string;
}

type SnapPhase = "idle" | "capturing" | "extracting" | "confirm" | "error";

export function SnapFab() {
	const [phase, setPhase] = useState<SnapPhase>("idle");
	const [extractedText, setExtractedText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [showDialog, setShowDialog] = useState(false);
	const cameraRef = useRef<HTMLInputElement>(null);
	const pathname = usePathname();
	const { isOnboarding } = useOnboarding();

	const isHomePage = pathname === "/";

	const handleSnap = useCallback(async () => {
		if (!cameraRef.current) return;
		cameraRef.current.click();
	}, []);

	const handleFileCapture = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			setPhase("capturing");
			setError(null);
			setShowDialog(true);

			try {
				const processed = await preprocessImage(file);
				setImagePreview(processed.dataUrl);

				const hash = getImageHash(processed.dataUrl);
				const cached = await offlineDB.extractionCache
					.where("imageHash")
					.equals(hash)
					.first();

				if (cached) {
					setExtractedText(cached.extractedText);
					setPhase("confirm");
					return;
				}

				setPhase("extracting");

				const response = await fetch("/api/solve", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						imageUrl: processed.dataUrl,
						mode: "extract",
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to read the problem from the image");
				}

				const data: ExtractionResult = await response.json();
				const text = data.solution || "";

				await offlineDB.extractionCache.add({
					imageHash: hash,
					extractedText: text,
					createdAt: Date.now(),
				});

				setExtractedText(text);
				setPhase("confirm");
			} catch (err) {
				console.error("Snap error:", err);
				setError(
					"Couldn't read the problem from the image. Try typing it instead.",
				);
				setPhase("error");
			}
		},
		[],
	);

	const handleSolve = useCallback(() => {
		if (!extractedText) return;
		setShowDialog(false);
		const params = new URLSearchParams({
			question: extractedText,
			openSolver: "true",
		});
		window.location.href = `/solve?${params.toString()}`;
	}, [extractedText]);

	const handleDismiss = useCallback(() => {
		setShowDialog(false);
		setPhase("idle");
		setExtractedText("");
		setError(null);
		setImagePreview(null);
	}, []);

	if (isHomePage || isOnboarding) return null;

	return (
		<>
			<input
				ref={cameraRef}
				type="file"
				accept="image/*"
				capture="environment"
				onChange={handleFileCapture}
				className="hidden"
			/>

			<button
				type="button"
				onClick={handleSnap}
				aria-label="Snap photo to solve"
				className={cn(
					"fixed right-5 bottom-31 z-toast",
					"flex size-12 items-center justify-center",
					"rounded-full bg-[--system-accent] text-white",
					"shadow-level-3 transition-transform active:scale-90",
					"hover:bg-[--system-accent]/90",
				)}
			>
				<HugeiconsIcon icon={Camera01Icon} className="size-5" />
			</button>

			<Dialog open={showDialog} onOpenChange={(o) => !o && handleDismiss()}>
				<DialogContent className="sm:max-w-lg">
					<DialogTitle className="ios-title-3 text-[--system-text-primary]">
						{phase === "extracting" && "Reading problem…"}
						{phase === "confirm" && "Verify extracted problem"}
						{phase === "error" && "Something went wrong"}
						{phase === "capturing" && "Processing image…"}
					</DialogTitle>

					<div className="flex flex-col gap-4 py-2">
						{imagePreview && phase !== "capturing" && (
							<div className="overflow-hidden rounded-xl border border-border">
								<Image
									src={imagePreview}
									alt="Captured problem"
									width={500}
									height={300}
									className="max-h-48 w-full object-contain"
									unoptimized
								/>
							</div>
						)}

						{phase === "capturing" && (
							<div className="flex items-center justify-center gap-3 py-8">
								<div className="size-6 animate-spin rounded-full border-2 border-[--system-accent] border-t-transparent" />
								<span className="text-[--system-text-secondary] text-sm">
									Processing image…
								</span>
							</div>
						)}

						{phase === "extracting" && (
							<div className="flex items-center justify-center gap-3 py-8">
								<div className="size-6 animate-spin rounded-full border-2 border-[--system-accent] border-t-transparent" />
								<span className="text-[--system-text-secondary] text-sm">
									Reading problem from image…
								</span>
							</div>
						)}

						{phase === "confirm" && (
							<Textarea
								value={extractedText}
								onChange={(e) => setExtractedText(e.target.value)}
								className="min-h-[120px] rounded-xl bg-system-surface px-4 py-3"
								placeholder="Edit the extracted problem if needed…"
							/>
						)}

						{phase === "error" && (
							<div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
								{error}
							</div>
						)}

						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={handleDismiss}
								className="flex-1"
							>
								Cancel
							</Button>
							{phase === "confirm" && (
								<Button onClick={handleSolve} className="flex-1">
									Solve Problem
								</Button>
							)}
							{phase === "error" && (
								<Button
									variant="default"
									onClick={() => {
										setShowDialog(false);
										setPhase("idle");
									}}
									className="flex-1"
								>
									Type Instead
								</Button>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
