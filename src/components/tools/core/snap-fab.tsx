"use client";

import {
	BookOpen02Icon,
	Camera01Icon,
	CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/hooks/use-onboarding";
import { usePathname } from "@/i18n/navigation";
import { dexieDataAccess } from "@/lib/db";
import type { ContentDataAccess } from "@/lib/db/data-access";

const _deps: { db: ContentDataAccess } = { db: dexieDataAccess };

import { flashcardEngine } from "@/lib/flashcard-engine";
import { tryLocalOcr } from "@/lib/ocr/local-ocr";
import { cn } from "@/lib/shared";
import { dispatchSnapAnswer } from "@/lib/shared/snap-answer";
import { getImageHash, preprocessImage } from "@/lib/utils/image-preprocess";
import { CameraPreview } from "../communication/camera-preview";

interface ExtractionResult {
	solution: string;
	provider: string;
}

interface SolveResult {
	solution: string;
	steps: string[];
	provider: string;
}

type SnapPhase =
	| "idle"
	| "capturing"
	| "extracting"
	| "confirm"
	| "solving"
	| "solved"
	| "error";

const MATH_SUBJECTS = new Set([
	"mathematics",
	"mathematical-literacy",
	"technical-mathematics",
	"physical-sciences",
]);

export function SnapFab({ inline }: { inline?: boolean }) {
	const [phase, setPhase] = useState<SnapPhase>("idle");
	const [extractedText, setExtractedText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
	const [showDialog, setShowDialog] = useState(false);
	const [flashcardCreated, setFlashcardCreated] = useState(false);
	const [creatingFlashcard, setCreatingFlashcard] = useState(false);
	const [showCamera, setShowCamera] = useState(false);
	const hiddenFileRef = useRef<HTMLInputElement>(null);
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { isOnboarding } = useOnboarding();

	const isOnQuizOrFlashcards =
		pathname.startsWith("/quiz") || pathname.startsWith("/flashcards");
	const isOnExam = pathname.startsWith("/exam/");
	const subjectParam = searchParams.get("subject");
	const isMathSubject = useMemo(
		() => !subjectParam || MATH_SUBJECTS.has(subjectParam),
		[subjectParam],
	);

	const shouldShow =
		!isOnboarding && (isOnExam || (isOnQuizOrFlashcards && isMathSubject));

	const handleSnap = useCallback(() => {
		setShowCamera(true);
	}, []);

	const handleCameraCapture = useCallback(async (dataUrl: string) => {
		setShowCamera(false);
		setPhase("capturing");
		setError(null);
		setShowDialog(true);

		try {
			const hash = getImageHash(dataUrl);
			const cached = await _deps.db.extractionCache
				.where("imageHash")
				.equals(hash)
				.first();

			if (cached) {
				setExtractedText(cached.extractedText);
				setImagePreview(dataUrl);
				setPhase("confirm");
				return;
			}

			setImagePreview(dataUrl);
			setPhase("extracting");

			const localText = await tryLocalOcr(dataUrl);
			if (localText) {
				await _deps.db.extractionCache.add({
					imageHash: hash,
					extractedText: localText,
					createdAt: Date.now(),
				});
				setExtractedText(localText);
				setPhase("confirm");
				return;
			}

			const response = await fetch("/api/solve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imageUrl: dataUrl, mode: "extract" }),
			});

			if (!response.ok) {
				throw new Error("Failed to read the problem from the image");
			}

			const data: ExtractionResult = await response.json();
			const text = data.solution || "";

			await _deps.db.extractionCache.add({
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
				const cached = await _deps.db.extractionCache
					.where("imageHash")
					.equals(hash)
					.first();

				if (cached) {
					setExtractedText(cached.extractedText);
					setPhase("confirm");
					return;
				}

				setPhase("extracting");

				const localText = await tryLocalOcr(processed.dataUrl);
				if (localText) {
					await _deps.db.extractionCache.add({
						imageHash: hash,
						extractedText: localText,
						createdAt: Date.now(),
					});
					setExtractedText(localText);
					setPhase("confirm");
					return;
				}

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

				await _deps.db.extractionCache.add({
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

	const handleSolveInline = useCallback(async () => {
		if (!extractedText) return;
		setPhase("solving");
		setError(null);
		try {
			const response = await fetch("/api/solve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question: extractedText, mode: "solve" }),
			});
			if (!response.ok) throw new Error("Failed to solve");
			const data: SolveResult = await response.json();
			setSolveResult(data);
			setPhase("solved");
		} catch {
			setError("Failed to solve. Try the full solver instead.");
			setPhase("error");
		}
	}, [extractedText]);

	const handleCreateFlashcard = useCallback(async () => {
		if (!extractedText || !solveResult) return;
		setCreatingFlashcard(true);
		try {
			await flashcardEngine.create(
				extractedText.slice(0, 200),
				solveResult.solution,
				subjectParam ?? "mathematics",
			);
			setFlashcardCreated(true);
		} finally {
			setCreatingFlashcard(false);
		}
	}, [extractedText, solveResult, subjectParam]);

	const handleFillAnswer = useCallback(() => {
		if (!extractedText) return;
		dispatchSnapAnswer(extractedText);
		setShowDialog(false);
		setPhase("idle");
		setExtractedText("");
		setImagePreview(null);
	}, [extractedText]);

	const handleOpenSolver = useCallback(() => {
		if (!extractedText) return;
		setShowDialog(false);
		const params = new URLSearchParams({
			question: extractedText,
		});
		window.location.href = `/solve?${params.toString()}`;
	}, [extractedText]);

	const handleDismiss = useCallback(() => {
		setShowDialog(false);
		setPhase("idle");
		setExtractedText("");
		setError(null);
		setImagePreview(null);
		setSolveResult(null);
		setShowCamera(false);
	}, []);

	if (!shouldShow) return null;

	return (
		<>
			<input
				ref={hiddenFileRef}
				type="file"
				accept="image/*"
				onChange={handleFileCapture}
				className="hidden"
			/>

			<Dialog open={showCamera} onOpenChange={() => setShowCamera(false)}>
				<DialogContent
					showCloseButton={false}
					className="w-full max-w-md sm:max-w-md"
				>
					<DialogTitle className="sr-only">Camera</DialogTitle>
					<CameraPreview
						onCapture={handleCameraCapture}
						onClose={() => setShowCamera(false)}
					/>
				</DialogContent>
			</Dialog>

			{inline ? (
				<button
					type="button"
					onClick={handleSnap}
					aria-label="Snap photo to solve"
					className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[--system-accent] text-white shadow-level-2 transition-transform hover:bg-[--system-accent]/90 active:scale-90"
				>
					<HugeiconsIcon icon={Camera01Icon} className="size-5" />
				</button>
			) : (
				<Button
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
				</Button>
			)}

			<Dialog open={showDialog} onOpenChange={(o) => !o && handleDismiss()}>
				<DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-lg">
					<DialogTitle className="ios-title-3 text-[--system-text-primary]">
						{phase === "extracting" && "Reading problem…"}
						{phase === "confirm" && "Verify extracted problem"}
						{phase === "solving" && "Solving…"}
						{phase === "solved" && "Solution"}
						{phase === "error" && "Something went wrong"}
						{phase === "capturing" && "Processing image…"}
					</DialogTitle>

					<div className="flex flex-col gap-4 py-2">
						{imagePreview && phase !== "capturing" && phase !== "solving" && (
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

						{phase === "solving" && (
							<div className="flex items-center justify-center gap-3 py-8">
								<div className="size-6 animate-spin rounded-full border-2 border-[--system-accent] border-t-transparent" />
								<span className="text-[--system-text-secondary] text-sm">
									Solving…
								</span>
							</div>
						)}

						{phase === "confirm" && (
							<Textarea
								value={extractedText}
								onChange={(e) => setExtractedText(e.target.value)}
								className="min-h-30 rounded-xl bg-system-surface px-4 py-3"
								placeholder="Edit the extracted problem if needed…"
							/>
						)}

						{phase === "solved" && solveResult && (
							<div className="flex flex-col gap-4">
								<div className="rounded-xl border border-border bg-card p-4">
									<MarkdownRenderer
										content={solveResult.solution}
										subject="mathematics"
									/>
								</div>
								{solveResult.steps.length > 0 && (
									<div className="flex flex-col gap-2">
										<h4 className="font-medium text-muted-foreground text-sm">
											Steps
										</h4>
										{solveResult.steps.map((step, i) => (
											<div
												key={`st-${step.slice(0, 40).replace(/\s+/g, "-")}`}
												data-index={i}
												className="rounded-lg border border-border/60 bg-muted/30 p-3"
											>
												<span className="mr-2 font-mono text-muted-foreground text-xs">
													{i + 1}.
												</span>
												<MarkdownRenderer
													content={step}
													subject="mathematics"
												/>
											</div>
										))}
									</div>
								)}
							</div>
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
								{phase === "solved" ? "Close" : "Cancel"}
							</Button>
							{phase === "solved" && (
								<Button
									variant="secondary"
									onClick={handleCreateFlashcard}
									disabled={creatingFlashcard || flashcardCreated}
									className="flex-1 gap-1.5"
								>
									<HugeiconsIcon
										icon={
											flashcardCreated ? CheckmarkCircle01Icon : BookOpen02Icon
										}
										className="size-4"
									/>
									{creatingFlashcard
										? "Creating…"
										: flashcardCreated
											? "Flashcard Created"
											: "Create Flashcard"}
								</Button>
							)}
							{phase === "confirm" && (
								<>
									{isOnQuizOrFlashcards && (
										<Button
											onClick={handleFillAnswer}
											variant="default"
											className="flex-1"
										>
											Use as Answer
										</Button>
									)}
									<Button
										onClick={handleSolveInline}
										variant={isOnQuizOrFlashcards ? "outline" : "default"}
										className="flex-1"
									>
										Solve Here
									</Button>
									<Button
										onClick={handleOpenSolver}
										variant="outline"
										className="flex-1"
									>
										Open Solver
									</Button>
								</>
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
