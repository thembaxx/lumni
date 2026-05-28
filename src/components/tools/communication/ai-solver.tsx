"use client";

import { RadialIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { tryLocalOcr } from "@/lib/ocr/local-ocr";
import { CameraPreview } from "./camera-preview";
import { SolverInputTools } from "./solver-input-tools";
import { SolverResultView } from "./solver-result-view";
import { SolverSubjectSelector, type Subject } from "./solver-subject-selector";
import { SymbolPalette } from "./symbol-palette";

interface SolverResponse {
	solution: string;
	steps: string[];
	provider: string;
}

type SolverPhase = "input" | "extracting" | "confirm" | "solving" | "result";

interface AiSolverProps {
	cameraFocus?: boolean;
	initialQuestion?: string;
}

export function AiSolver({ cameraFocus, initialQuestion }: AiSolverProps) {
	return (
		<AppErrorBoundary>
			<AiSolverInner
				cameraFocus={cameraFocus}
				initialQuestion={initialQuestion}
			/>
		</AppErrorBoundary>
	);
}

function AiSolverInner({ cameraFocus, initialQuestion }: AiSolverProps) {
	const [subject, setSubject] = useState<Subject>("general");
	const [question, setQuestion] = useState(initialQuestion ?? "");
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [result, setResult] = useState<SolverResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [phase, setPhase] = useState<SolverPhase>(
		initialQuestion ? "confirm" : "input",
	);
	const [showCamera, setShowCamera] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const didAutoFocus = useRef(false);

	useEffect(() => {
		if (cameraFocus && !didAutoFocus.current) {
			didAutoFocus.current = true;
			setShowCamera(true);
		}
	}, [cameraFocus]);

	const insertSymbol = (symbol: string) => {
		if (!textareaRef.current) return;
		const start = textareaRef.current.selectionStart;
		const end = textareaRef.current.selectionEnd;
		const text = textareaRef.current.value;
		const before = text.substring(0, start);
		const after = text.substring(end);
		setQuestion(before + symbol + after);
		requestAnimationFrame(() => {
			textareaRef.current?.focus();
			textareaRef.current?.setSelectionRange(
				start + symbol.length,
				start + symbol.length,
			);
		});
	};

	const handleCameraCapture = async (dataUrl: string) => {
		setShowCamera(false);
		startExtract(dataUrl);
	};

	const startExtract = async (imgUrl: string) => {
		setImageUrl(imgUrl);
		setPhase("extracting");
		setError(null);
		setResult(null);

		const extracted = await tryLocalOcr(imgUrl);
		if (extracted) {
			setQuestion(extracted);
			setPhase("confirm");
			return;
		}

		try {
			const response = await fetch("/api/solve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imageUrl: imgUrl, mode: "extract" }),
			});

			if (!response.ok) throw new Error("Failed to read the problem");

			const data = await response.json();
			setQuestion(data.solution || "");
			setPhase("confirm");
		} catch (err) {
			console.error("Extract error:", err);
			setError(
				"Couldn't read the problem from the image. Try typing it instead.",
			);
			setPhase("input");
		}
	};

	const handleUploadComplete = (res: { url: string }[]) => {
		if (res?.[0]) {
			startExtract(res[0].url);
		}
	};

	const handleSolve = async () => {
		if (!question && !imageUrl) {
			setError("Please provide a question or an image");
			return;
		}

		setPhase("solving");
		setResult(null);
		setError(null);

		const subjectKey = subject !== "general" ? subject : undefined;
		try {
			const response = await fetch("/api/solve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					question,
					imageUrl: imageUrl || undefined,
					subject: subjectKey,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to solve the problem");
			}

			const data = await response.json();
			setResult(data);
			setPhase("result");
		} catch (err) {
			console.error("Solver error:", err);
			setError("Failed to solve the problem. Please try again.");
			setPhase("input");
		}
	};

	const handleRetake = () => {
		setImageUrl(null);
		setQuestion("");
		setResult(null);
		setError(null);
		setPhase("input");
	};

	const handleReset = () => {
		setQuestion("");
		setImageUrl(null);
		setResult(null);
		setError(null);
		setPhase("input");
	};

	const showSymbols = phase === "input" || phase === "confirm";
	const showTextarea = phase === "input" || phase === "confirm";
	const textareaDisabled = phase === "extracting" || phase === "solving";

	return (
		<div className="flex h-full flex-col overflow-y-auto">
			{error && (
				<div className="fade-in slide-in-from-top-1 mx-5 mt-5 animate-in rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
					{error}
				</div>
			)}

			<div className="px-6 pt-5 pb-3">
				<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
					AI Solver
				</h2>
				<p className="ios-subhead mt-1.5 text-[--system-text-secondary]/60">
					{phase === "confirm"
						? "Verify the extracted problem then solve it."
						: "Snap a photo of your homework or type a question."}
				</p>
			</div>

			{showCamera && (
				<div className="px-5 pb-5">
					<CameraPreview
						onCapture={handleCameraCapture}
						onClose={() => setShowCamera(false)}
					/>
				</div>
			)}

			<div className="px-5 pb-5">
				<div className="flex flex-col gap-4 rounded-xl bg-system-background-secondary p-5">
					{showSymbols && (
						<SolverSubjectSelector subject={subject} onChange={setSubject} />
					)}
					{showSymbols && <SymbolPalette onInsert={insertSymbol} />}

					{showTextarea && (
						<Textarea
							ref={textareaRef}
							placeholder={
								phase === "confirm"
									? "Edit the extracted problem if needed…"
									: "Type your question here…"
							}
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
							disabled={textareaDisabled}
							className="min-h-25 rounded-xl bg-system-surface px-4 py-3 focus-visible:ring-[--system-accent]/30 focus-visible:ring-[3px]"
						/>
					)}

					{(phase === "extracting" || phase === "solving") && (
						<div className="fade-in flex animate-in items-center justify-center gap-3 py-8">
							<HugeiconsIcon
								icon={RadialIcon}
								className="size-6 animate-spin text-[--system-accent]"
							/>
							<span className="text-[--system-text-secondary] text-sm">
								{phase === "extracting"
									? "Reading problem from image…"
									: "Solving step-by-step…"}
							</span>
						</div>
					)}

					<SolverInputTools
						phase={phase}
						imageUrl={imageUrl}
						onCameraClick={() => setShowCamera(true)}
						onRetake={handleRetake}
						onUploadComplete={handleUploadComplete}
						onUploadError={(error: Error) => {
							setError(`Upload failed: ${error.message}`);
						}}
					/>
				</div>
			</div>

			{phase === "confirm" && (
				<div className="px-5 pb-6">
					<Button
						onClick={handleSolve}
						className="h-12 w-full gap-2 rounded-xl font-medium text-sm shadow-solver transition-shadow"
					>
						<HugeiconsIcon icon={SparklesIcon} data-icon />
						Solve Problem
					</Button>
				</div>
			)}

			{phase === "result" && result && (
				<SolverResultView
					subject={subject}
					result={result}
					onReset={handleReset}
				/>
			)}
		</div>
	);
}
