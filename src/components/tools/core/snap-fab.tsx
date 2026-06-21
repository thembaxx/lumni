"use client";

import { Camera01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useOnboarding } from "@/hooks/use-onboarding";
import { usePathname } from "@/i18n/navigation";
import { dexieDataAccess } from "@/lib/db";
import type { ContentDataAccess } from "@/lib/db/data-access";

const _deps: { db: ContentDataAccess } = { db: dexieDataAccess };

import { flashcardEngine } from "@/lib/flashcard-engine";
import { tryLocalOcr } from "@/lib/ocr/local-ocr";
import { logError } from "@/lib/shared/logger";
import { dispatchSnapAnswer } from "@/lib/shared/snap-answer";
import { cn } from "@/lib/utils";
import { getImageHash, preprocessImage } from "@/lib/utils/image-preprocess";
import { CameraPreview } from "../communication/camera-preview";
import { SnapDialog, type SolveResult } from "./snap-dialog";

interface ExtractionResult {
	solution: string;
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

async function extractFromImage(
	dataUrl: string,
): Promise<{ text: string; fromCache: boolean }> {
	const hash = getImageHash(dataUrl);
	const cached = await _deps.db.extractionCache
		.where("imageHash")
		.equals(hash)
		.first();

	if (cached) {
		return { text: cached.extractedText, fromCache: true };
	}

	const localText = await tryLocalOcr(dataUrl);
	if (localText) {
		await _deps.db.extractionCache.add({
			imageHash: hash,
			extractedText: localText,
			createdAt: Date.now(),
		});
		return { text: localText, fromCache: false };
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

	return { text, fromCache: false };
}

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
	const { push } = useNavigationDirection();

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

	const processCapture = useCallback(async (dataUrl: string) => {
		setShowCamera(false);
		setPhase("capturing");
		setError(null);
		setShowDialog(true);
		setImagePreview(dataUrl);

		try {
			const result = await extractFromImage(dataUrl);
			setExtractedText(result.text);
			setPhase("confirm");
		} catch (err) {
			logError("SnapFab.capture", err);
			setError(
				"Couldn't read the problem from the image. Try typing it instead.",
			);
			setPhase("error");
		}
	}, []);

	const handleCameraCapture = useCallback(
		(dataUrl: string) => processCapture(dataUrl),
		[processCapture],
	);

	const handleFileCapture = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			try {
				const processed = await preprocessImage(file);
				await processCapture(processed.dataUrl);
			} catch (err) {
				logError("SnapFab.fileCapture", err);
				setError(
					"Couldn't read the problem from the image. Try typing it instead.",
				);
				setPhase("error");
			}
		},
		[processCapture],
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
		const params = new URLSearchParams({ question: extractedText });
		push(`/solve?${params.toString()}`);
	}, [extractedText, push]);

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
				aria-label="Upload photo"
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
				<SnapDialog
					phase={phase}
					error={error}
					imagePreview={imagePreview}
					solveResult={solveResult}
					extractedText={extractedText}
					setExtractedText={setExtractedText}
					flashcardCreated={flashcardCreated}
					creatingFlashcard={creatingFlashcard}
					isOnQuizOrFlashcards={isOnQuizOrFlashcards}
					onSolveInline={handleSolveInline}
					onOpenSolver={handleOpenSolver}
					onCreateFlashcard={handleCreateFlashcard}
					onFillAnswer={handleFillAnswer}
					onDismiss={handleDismiss}
				/>
			</Dialog>
		</>
	);
}
