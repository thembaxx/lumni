"use client";

import {
	Camera01Icon,
	Cancel01Icon,
	Image03FreeIcons,
	RadialIcon,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { StepByStep } from "@/components/quiz/step-by-step";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/shared";
import { UploadButton } from "@/lib/uploadthing";
import { CameraPreview } from "./camera-preview";

const SUBJECTS = [
	{ id: "general", label: "General" },
	{ id: "pre-algebra", label: "Pre-Algebra" },
	{ id: "algebra", label: "Algebra" },
	{ id: "trigonometry", label: "Trigonometry" },
	{ id: "calculus", label: "Calculus" },
	{ id: "geometry", label: "Geometry" },
	{ id: "statistics", label: "Statistics" },
	{ id: "matrix", label: "Matrix" },
] as const;

type Subject = (typeof SUBJECTS)[number]["id"];

interface SolverResponse {
	solution: string;
	steps: string[];
	provider: string;
}

type SolverPhase = "input" | "extracting" | "confirm" | "solving" | "result";

const MATH_SYMBOLS = [
	{ label: "√", value: "√" },
	{ label: "π", value: "π" },
	{ label: "²", value: "²" },
	{ label: "³", value: "³" },
	{ label: "±", value: "±" },
	{ label: "÷", value: "÷" },
	{ label: "×", value: "×" },
	{ label: "∑", value: "∑" },
	{ label: "∫", value: "∫" },
	{ label: "≠", value: "≠" },
	{ label: "≈", value: "≈" },
	{ label: "∞", value: "∞" },
];

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
						<div className="flex flex-wrap gap-1.5">
							{SUBJECTS.map((s) => (
								<button
									key={s.id}
									type="button"
									onClick={() => setSubject(s.id)}
									className={cn(
										"h-7 rounded-lg border px-2.5 font-medium text-xs transition-colors",
										subject === s.id
											? "border-[--system-accent] bg-[--system-accent] text-white"
											: "border-border bg-system-fill text-[--system-text-secondary] hover:border-[--system-accent]/40",
									)}
								>
									{s.label}
								</button>
							))}
						</div>
					)}
					{showSymbols && (
						<div className="flex flex-wrap gap-1">
							{MATH_SYMBOLS.map((s) => (
								<Button
									key={s.label}
									variant="ghost"
									size="sm"
									onClick={() => insertSymbol(s.value)}
									className="ios-footnote h-6 w-7 p-0 text-[--system-text-secondary] hover:text-[--system-accent]"
								>
									{s.label}
								</Button>
							))}
						</div>
					)}

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

					{(phase === "input" || phase === "confirm") && (
						<div className="flex items-center gap-4">
							<div className="flex flex-1 gap-2">
								{phase === "input" && (
									<>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setShowCamera(true)}
											className="h-10 gap-2 rounded-xl px-4"
										>
											<HugeiconsIcon icon={Camera01Icon} data-icon />
											<span className="text-sm">Take Photo</span>
										</Button>
										<UploadButton
											endpoint="imageUploader"
											onClientUploadComplete={handleUploadComplete}
											onUploadError={(error: Error) => {
												setError(`Upload failed: ${error.message}`);
											}}
											appearance={{
												button:
													"bg-system-fill hover:bg-system-fill-secondary text-foreground h-10 px-4 py-2 text-sm border border-border w-full transition-colors rounded-xl",
												allowedContent: "hidden",
											}}
											content={{
												button({ ready }) {
													if (ready)
														return (
															<div className="flex items-center gap-2 text-foreground text-sm">
																<HugeiconsIcon
																	icon={Image03FreeIcons}
																	className="size-4"
																	data-icon
																/>
																<span>Upload</span>
															</div>
														);
													return "Working on it…";
												},
											}}
										/>
									</>
								)}
								{phase === "confirm" && imageUrl && (
									<Button
										variant="outline"
										size="sm"
										onClick={handleRetake}
										className="h-10 gap-2 rounded-xl px-4"
									>
										<HugeiconsIcon icon={Camera01Icon} data-icon />
										<span className="text-sm">Retake</span>
									</Button>
								)}
							</div>
							{imageUrl && (
								<div className="group relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-[--system-accent]/20 shadow-level-2">
									<Image
										src={imageUrl}
										alt="Uploaded problem"
										fill
										sizes="80px"
										className="object-cover outline outline-black/10 -outline-offset-1 transition-transform group-hover:scale-110 dark:outline-white/10"
									/>
									<Button
										variant="destructive"
										size="icon-xs"
										onClick={handleRetake}
										className="absolute top-1 right-1 size-5"
									>
										<HugeiconsIcon icon={Cancel01Icon} data-icon />
									</Button>
								</div>
							)}
						</div>
					)}
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
				<div className="animate-fade-in-up px-5 pb-10">
					<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-level-2">
						<div className="p-6">
							{subject !== "general" && (
								<div className="mb-4">
									<span className="rounded-full bg-[--system-accent]/10 px-2.5 py-1 font-medium text-[--system-accent] text-xs">
										{SUBJECTS.find((s) => s.id === subject)?.label}
									</span>
								</div>
							)}
							<div className="rounded-xl border border-border/50 bg-system-background p-5">
								<div className="whitespace-pre-wrap font-medium text-foreground text-sm leading-relaxed">
									{result.solution}
								</div>
							</div>

							{result.steps && result.steps.length > 0 && (
								<div className="mt-6">
									<p className="mb-4 font-bold text-muted-foreground text-xs uppercase tracking-wider">
										Steps
									</p>
									<StepByStep steps={result.steps} />
								</div>
							)}
						</div>
					</div>

					<Button
						variant="outline"
						onClick={handleReset}
						className="mt-4 h-10 w-full gap-2 rounded-xl"
					>
						Solve Another Problem
					</Button>
				</div>
			)}
		</div>
	);
}

async function tryLocalOcr(imageData: string): Promise<string | null> {
	try {
		const { recognizeImage } = await import("@/lib/ocr");
		const result = await recognizeImage(imageData, "printed");
		if (result.confidence > 60 && result.text.length > 3) {
			return result.text;
		}
		return null;
	} catch {
		return null;
	}
}
