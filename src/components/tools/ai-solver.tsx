"use client";

import { Image as ImageIcon, Loader2, Send, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { StepByStep } from "@/components/quiz/step-by-step";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

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
		<div className="h-full flex flex-col p-4 space-y-4 max-w-2xl mx-auto overflow-y-auto">
			{error && (
				<div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
					{error}
				</div>
			)}

			<Card className="border-primary/20 bg-primary/5 shadow-inner overflow-hidden">
				<CardHeader className="pb-2">
					<CardTitle className="text-lg flex items-center gap-2">
						<Sparkles className="w-5 h-5 text-primary animate-pulse" />
						AI Solver
					</CardTitle>
					<p className="text-xs text-muted-foreground">
						Upload a photo of your homework or type a question to get a
						step-by-step solution.
					</p>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="space-y-2">
						<div className="flex flex-wrap gap-1 p-1 bg-background/50 rounded-md border border-border/50">
							{MATH_SYMBOLS.map((s) => (
								<Button
									key={s.label}
									variant="ghost"
									size="sm"
									onClick={() => insertSymbol(s.value)}
									className="h-7 w-8 p-0 text-xs font-serif hover:bg-primary/20"
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
							className="min-h-30 resize-none bg-background/50 border-primary/10 focus-visible:ring-primary/30"
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
									setError(`Upload failed: ${error.message}`);
								}}
								appearance={{
									button:
										"bg-primary/20 hover:bg-primary/30 text-primary h-10 px-4 py-2 text-sm border border-primary/20 w-full transition-colors",
									allowedContent: "hidden",
								}}
								content={{
									button({ ready }) {
										if (ready)
											return (
												<div className="flex items-center gap-2">
													<ImageIcon className="w-4 h-4" />
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
							<div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg group">
								<Image
									src={imageUrl}
									alt="Uploaded"
									fill
									className="object-cover transition-transform group-hover:scale-110"
								/>
								<button
									onClick={() => setImageUrl(null)}
									className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-destructive-foreground p-1 rounded-full backdrop-blur-sm transition-colors"
								>
									<X className="w-3 h-3" />
								</button>
							</div>
						)}
					</div>
				</CardContent>

				<CardFooter>
					<Button
						onClick={handleSolve}
						disabled={loading || (!question && !imageUrl)}
						className={cn(
							"w-full gap-2 h-11 text-base font-medium transition-colors shadow-lg shadow-primary/20",
							loading && "animate-pulse",
						)}
					>
						{loading ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Thinking...
							</>
						) : (
							<>
								<Send className="w-4 h-4" />
								Solve Problem
							</>
						)}
					</Button>
				</CardFooter>
			</Card>

			{result && (
				<Card className="animate-in fade-in slide-in-from-bottom-6 duration-500 border-primary/10">
					<CardHeader className="bg-primary/5 border-b border-primary/10">
						<CardTitle className="text-base flex items-center gap-2">
							<Sparkles className="w-4 h-4 text-primary" />
							Final Answer
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-6 space-y-6">
						<div className="bg-background rounded-lg p-4 border border-border shadow-sm">
							<div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
								{result.solution}
							</div>
						</div>

						{result.steps && result.steps.length > 0 && (
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<div className="h-px flex-1 bg-border" />
									<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
										Step-by-Step Breakdown
									</p>
									<div className="h-px flex-1 bg-border" />
								</div>
								<StepByStep steps={result.steps} />
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
