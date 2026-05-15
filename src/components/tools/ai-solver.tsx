"use client";

import {
	Image as ImageIcon,
	PaperPlane,
	Sparkle,
	Spinner,
	X,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { StepByStep } from "@/components/quiz/step-by-step";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

		// Set cursor position after the symbol
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
		<div className="h-full flex flex-col p-4 gap-4 max-w-2xl mx-auto overflow-y-auto">
			{error && (
				<div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
					{error}
				</div>
			)}

			<div className="border-[--system-accent]/20 bg-[--system-accent]/5 shadow-inner overflow-hidden">
				<header className="rounded-t-[2.5rem] border-t border-border/80 pb-2">
					<h2 className="font-heading text-sm font-medium text-lg flex items-center gap-2">
						<Sparkle className="size-5 text-foreground animate-pulse" />
						AI Solver
					</h2>
					<p className="text-xs text-muted-foreground">
						Upload a photo of your homework or type a question to get a
						step-by-step solution.
					</p>
				</header>

				<div className="px-4 group-data-[size=sm]/card:px-3 flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<div className="flex flex-wrap gap-1 p-1 bg-background/50 rounded-md border border-border/50">
							{MATH_SYMBOLS.map((s) => (
								<Button
									key={s.label}
									variant="ghost"
									size="sm"
									onClick={() => insertSymbol(s.value)}
									className="h-7 w-8 p-0 ios-footnote hover:bg-[--system-accent]/20"
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
							className="min-h-30 resize-none bg-background/50 border-[--system-accent]/10 focus-visible:ring-[--system-accent]/30"
						/>
					</div>

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
									setError(`CloudArrowUp failed: ${error.message}`);
								}}
								appearance={{
									button:
										"bg-[--system-accent]/20 hover:bg-[--system-accent]/30 text-foreground h-10 px-4 py-2 text-sm border border-[--system-accent]/20 w-full transition-colors",
									allowedContent: "hidden",
								}}
								content={{
									button({ ready }) {
										if (ready)
											return (
												<div className="flex items-center gap-2">
													<ImageIcon data-icon />
													<span>
														{imageUrl ? "Replace Photo" : "CloudArrowUp Photo"}
													</span>
												</div>
											);
										return "Working on it...";
									},
								}}
							/>
						</div>
						{imageUrl && (
							<div className="relative size-20 rounded-lg overflow-hidden border-2 border-[--system-accent]/20 shadow-lg group">
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
									className="absolute top-1 right-1"
								>
									<X data-icon />
								</Button>
							</div>
						)}
					</div>
				</div>

				<footer className="flex items-center rounded-b-[2.5rem] border-t border-border/80 px-4 group-data-[size=sm]/card:px-3 [.border-t]:pt-4 group-data-[size=sm]/card:[.border-t]:pt-3">
					<Button
						onClick={handleSolve}
						disabled={loading || (!question && !imageUrl)}
						className={cn(
							"w-full gap-2 h-11 text-base font-medium transition-colors shadow-lg shadow-[--system-accent]/20",
							loading && "animate-pulse",
						)}
					>
						{loading ? (
							<>
								<Spinner data-icon className="animate-spin" />
								Thinking...
							</>
						) : (
							<>
								<PaperPlane data-icon />
								Solve Problem
							</>
						)}
					</Button>
				</footer>
			</div>

			{result && (
				<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors animate-in fade-in slide-in-from-bottom-6 duration-500 border-[--system-accent]/10">
					<header className="rounded-t-[2.5rem] border-t border-border/80 bg-[--system-accent]/5 border-b border-[--system-accent]/10">
						<h2 className="font-heading text-sm font-medium text-base flex items-center gap-2">
							<Sparkle className="size-4 text-foreground" />
							Final Answer
						</h2>
					</header>
					<div className="px-4 group-data-[size=sm]/card:px-3 pt-6 flex flex-col gap-6">
						<div className="bg-background rounded-lg p-4 border border-border shadow-sm">
							<div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
								{result.solution}
							</div>
						</div>

						{result.steps && result.steps.length > 0 && (
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-2">
									<Separator className="flex-1" />
									<p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
										Step-by-Step Breakdown
									</p>
									<Separator className="flex-1" />
								</div>
								<StepByStep steps={result.steps} />
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
