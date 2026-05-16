"use client";

import {
	Camera01FreeIcons,
	Image03FreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Camera,
	Image as ImageIcon,
	Sparkle,
	Spinner,
	X,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { StepByStep } from "@/components/quiz/step-by-step";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/shared";
import { UploadButton } from "@/lib/uploadthing";

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
	{ label: "x²", value: "²" },
	{ label: "x³", value: "³" },
	{ label: "±", value: "±" },
	{ label: "÷", value: "÷" },
	{ label: "×", value: "×" },
	{ label: "∑", value: "∑" },
	{ label: "∫", value: "∫" },
	{ label: "≠", value: "≠" },
	{ label: "≈", value: "≈" },
	{ label: "∞", value: "∞" },
];

function readFileAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

interface AiSolverProps {
	cameraFocus?: boolean;
}

export function AiSolver({ cameraFocus }: AiSolverProps) {
	const [subject, setSubject] = useState<Subject>("general");
	const [question, setQuestion] = useState("");
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [result, setResult] = useState<SolverResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [phase, setPhase] = useState<SolverPhase>("input");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const cameraInputRef = useRef<HTMLInputElement>(null);
	const didAutoFocus = useRef(false);

	useEffect(() => {
		if (cameraFocus && !didAutoFocus.current) {
			didAutoFocus.current = true;
			cameraInputRef.current?.click();
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

	const handleCameraCapture = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const dataUrl = await readFileAsDataURL(file);
		startExtract(dataUrl);
	};

	const startExtract = async (imgUrl: string) => {
		setImageUrl(imgUrl);
		setPhase("extracting");
		setError(null);
		setResult(null);

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
		<div className="h-full flex flex-col overflow-y-auto">
			{error && (
				<div className="mx-5 mt-5 bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-1">
					{error}
				</div>
			)}

			<div className="px-6 pt-5 pb-3">
				<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
					AI Solver
				</h2>
				<p className="ios-subhead text-[--system-text-secondary]/60 mt-1.5">
					{phase === "confirm"
						? "Verify the extracted problem then solve it."
						: "Snap a photo of your homework or type a question."}
				</p>
			</div>

			<div className="px-5 pb-5">
				<div className="bg-system-background-secondary rounded-2xl p-5 space-y-4">
					{showSymbols && (
						<div className="flex flex-wrap gap-1.5">
							{SUBJECTS.map((s) => (
								<button
									key={s.id}
									type="button"
									onClick={() => setSubject(s.id)}
									className={cn(
										"text-xs h-7 px-2.5 rounded-lg font-medium transition-colors border",
										subject === s.id
											? "bg-[--system-accent] text-white border-[--system-accent]"
											: "bg-system-fill text-[--system-text-secondary] border-border hover:border-[--system-accent]/40",
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
									className="h-6 w-7 p-0 ios-footnote text-[--system-text-secondary] hover:text-[--system-accent]"
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
									? "Edit the extracted problem if needed..."
									: "Type your question here..."
							}
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
							disabled={textareaDisabled}
							className="min-h-[100px] rounded-xl px-4 py-3 bg-system-surface focus-visible:ring-[3px] focus-visible:ring-[--system-accent]/30"
						/>
					)}

					{(phase === "extracting" || phase === "solving") && (
						<div className="flex items-center justify-center gap-3 py-8 animate-in fade-in">
							<Spinner className="size-6 animate-spin text-[--system-accent]" />
							<span className="text-sm text-[--system-text-secondary]">
								{phase === "extracting"
									? "Reading problem from image..."
									: "Solving step-by-step..."}
							</span>
						</div>
					)}

					{(phase === "input" || phase === "confirm") && (
						<div className="flex items-center gap-4">
							<div className="flex-1 flex gap-2">
								{phase === "input" && (
									<>
										<input
											ref={cameraInputRef}
											type="file"
											accept="image/*"
											capture="environment"
											onChange={handleCameraCapture}
											className="hidden"
										/>
										<Button
											variant="outline"
											size="sm"
											onClick={() => cameraInputRef.current?.click()}
											className="gap-2 rounded-xl h-10 px-4"
										>
											<Camera data-icon />
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
																	className="w-4 h-4"
																	data-icon
																/>
																<span>Upload</span>
															</div>
														);
													return "Working on it...";
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
										className="gap-2 rounded-xl h-10 px-4"
									>
										<Camera data-icon />
										<span className="text-sm">Retake</span>
									</Button>
								)}
							</div>
							{imageUrl && (
								<div className="relative size-20 rounded-xl overflow-hidden border-2 border-[--system-accent]/20 shadow-level-2 group shrink-0">
									<Image
										src={imageUrl}
										alt="Uploaded problem"
										fill
										className="object-cover transition-transform group-hover:scale-110"
									/>
									<Button
										variant="destructive"
										size="icon-xs"
										onClick={handleRetake}
										className="absolute top-1 right-1 size-5"
									>
										<X data-icon />
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
						className="w-full gap-2 h-12 font-medium rounded-xl text-sm shadow-solver transition-[box-shadow]"
					>
						<Sparkle data-icon />
						Solve Problem
					</Button>
				</div>
			)}

			{phase === "result" && result && (
				<div className="px-5 pb-10 animate-fade-in-up">
					<div className="rounded-2xl border border-border bg-card shadow-level-2 overflow-hidden">
						<div className="p-6">
							{subject !== "general" && (
								<div className="mb-4">
									<span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[--system-accent]/10 text-[--system-accent]">
										{SUBJECTS.find((s) => s.id === subject)?.label}
									</span>
								</div>
							)}
							<div className="bg-system-background rounded-xl p-5 border border-border/50">
								<div className="whitespace-pre-wrap text-sm leading-relaxed font-medium text-foreground">
									{result.solution}
								</div>
							</div>

							{result.steps && result.steps.length > 0 && (
								<div className="mt-6">
									<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
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
						className="mt-4 w-full gap-2 h-10 rounded-xl"
					>
						Solve Another Problem
					</Button>
				</div>
			)}
		</div>
	);
}
