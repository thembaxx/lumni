"use client";

import { Image03FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image as ImageIcon, Sparkle, Spinner, X } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { StepByStep } from "@/components/quiz/step-by-step";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/shared";
import { UploadButton } from "@/lib/uploadthing";

interface SolverResponse {
	solution: string;
	steps: string[];
	provider: string;
}

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

export function AiSolver() {
	const [question, setQuestion] = useState("");
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<SolverResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const insertSymbol = (symbol: string) => {
		if (!textareaRef.current) return;
		const start = textareaRef.current.selectionStart;
		const end = textareaRef.current.selectionEnd;
		const text = question;
		const before = text.substring(0, start);
		const after = text.substring(end);
		setQuestion(before + symbol + after);

		setTimeout(() => {
			if (textareaRef.current) {
				textareaRef.current.focus();
				textareaRef.current.setSelectionRange(
					start + symbol.length,
					start + symbol.length,
				);
			}
		}, 0);
	};

	const handleSolve = async () => {
		if (!question && !imageUrl) {
			setError("Please provide a question or an image");
			return;
		}

		setLoading(true);
		setResult(null);
		setError(null);

		try {
			const response = await fetch("/api/solve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question, imageUrl }),
			});

			if (!response.ok) {
				throw new Error("Failed to solve the problem");
			}

			const data = await response.json();
			setResult(data);
		} catch (error) {
			console.error("Solver error:", error);
			setError("Failed to solve the problem. Please try again.");
		} finally {
			setLoading(false);
		}
	};

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
					Upload a photo of your homework or type a question to get a
					step-by-step solution.
				</p>
			</div>

			<div className="px-5 pb-5">
				<div className="bg-system-background-secondary rounded-2xl p-5 space-y-4">
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

					<Textarea
						ref={textareaRef}
						placeholder="Type your question here..."
						value={question}
						onChange={(e) => setQuestion(e.target.value)}
						className="min-h-[160px] rounded-xl px-4 py-3 bg-system-surface focus-visible:ring-[3px] focus-visible:ring-[--system-accent]/30"
					/>

					<div className="flex items-center gap-4">
						<div className="flex-1">
							<UploadButton
								endpoint="imageUploader"
								onClientUploadComplete={(res) => {
									if (res?.[0]) {
										setImageUrl(res[0].url);
									}
								}}
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
												<div className="flex items-center gap-2 text-foreground">
													<HugeiconsIcon
														icon={Image03FreeIcons}
														className="w-4 h-4"
														data-icon
													/>
													<span>
														{imageUrl ? "Replace Photo" : "Upload Photo"}
													</span>
												</div>
											);
										return "Working on it...";
									},
								}}
							/>
						</div>
						{imageUrl && (
							<div className="relative size-24 rounded-xl overflow-hidden border-2 border-[--system-accent]/20 shadow-level-2 group shrink-0">
								<Image
									src={imageUrl}
									alt="Uploaded"
									fill
									className="object-cover transition-transform group-hover:scale-110"
								/>
								<Button
									variant="destructive"
									size="icon-xs"
									onClick={() => setImageUrl(null)}
									className="absolute top-1 right-1 size-5"
								>
									<X data-icon />
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="px-5 pb-6">
				<Button
					onClick={handleSolve}
					disabled={loading || (!question && !imageUrl)}
					className={cn(
						"w-full gap-2 h-12 font-medium rounded-xl text-sm shadow-solver transition-all",
						loading && "animate-pulse",
					)}
				>
					{loading ? (
						<>
							<Spinner data-icon className="animate-spin" />
							Thinking...
						</>
					) : (
						<>Solve Problem</>
					)}
				</Button>
			</div>

			{result && (
				<div className="px-5 pb-10 animate-fade-in-up">
					<div className="rounded-2xl border border-border bg-card shadow-level-2 overflow-hidden">
						<div className="p-6">
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
				</div>
			)}
		</div>
	);
}
