"use client";

import { m } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { DataResponseInput } from "@/components/quiz/parts/data-response-input";
import { MixedPartsInput } from "@/components/quiz/parts/mixed-parts-input";
import { SourceBasedInput } from "@/components/quiz/parts/source-based-input";
import { TTSButton } from "@/components/shared/tts-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	CalculationInput,
	EssayInput,
	LongAnswerInput,
	MatchingInput,
	ProgrammingInput,
	ShortAnswerInput,
} from "@/components/ui/inputs";
import type {
	MediaContent,
	Option,
	UserAnswer,
} from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

interface QuestionCardInputProps {
	question: {
		id: string;
		type: string;
		body: unknown;
		points: number;
		media?: MediaContent[];
		hint?: string;
		explanation?: string;
		steps?: string[];
	};
	effectiveSubject: string;
	state: {
		isSubmitted: boolean;
		selectedOption: string | null;
		calcValue: string;
		code: string;
	};
	options: Option[];
	calcValue: string;
	setCalcValue: React.Dispatch<React.SetStateAction<string>>;
	code: string;
	setCode: React.Dispatch<React.SetStateAction<string>>;
	handleMCQSelect: (optionId: string) => void;
	handleMCQSubmit: () => void;
	handleGrade: (answer: UserAnswer) => Promise<void>;
}

export function QuestionCardInput({
	question,
	effectiveSubject,
	state,
	options,
	calcValue,
	setCalcValue,
	code,
	setCode,
	handleMCQSelect,
	handleMCQSubmit,
	handleGrade,
}: QuestionCardInputProps) {
	const t = useTranslations();
	const [textInputValue, setTextInputValue] = useState("");
	const [longAnswerValue, setLongAnswerValue] = useState("");
	const [essayValue, setEssayValue] = useState("");
	const [unitValue, setUnitValue] = useState("");
	const [diagramMode, setDiagramMode] = useState<"draw" | "upload">("draw");
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);

	if (state.isSubmitted) {
		return null;
	}

	switch (question.type) {
		case "multiple-choice": {
			return (
				<div
					className={cn(
						"grid gap-2",
						options.every((o) => o.text.length <= 30)
							? "grid-cols-2"
							: "grid-cols-1",
					)}
				>
					{options.map((option, i) => {
						const isSelected = state.selectedOption === option.id;
						return (
							<m.div
								key={option.id}
								initial={{ opacity: 0, x: -8 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{
									delay: i * 0.05,
									duration: 0.25,
									ease: iOSEase,
								}}
								whileHover={{ scale: 1.01 }}
								whileTap={{ scale: 0.98 }}
							>
								<Button
									variant="ghost"
									type="button"
									onClick={() => handleMCQSelect(option.id)}
									className={cn(
										"quiz-option-btn flex min-h-12 w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left",
										isSelected &&
											"border-(--system-accent) bg-(--system-accent-alpha-10)",
									)}
								>
									<span
										className={cn(
											"flex h-6 w-6 items-center justify-center rounded-full border font-medium text-sm",
											isSelected
												? "border-[--system-accent] bg-[--system-accent] text-background"
												: "border-muted-foreground/30",
										)}
									>
										{option.id}
									</span>
									<span className="flex-1 font-medium">
										<MarkdownRenderer
											content={option.text}
											subject={effectiveSubject}
										/>
									</span>
									{option.text.length > 80 && <TTSButton text={option.text} />}
								</Button>
							</m.div>
						);
					})}
					<Button
						onClick={handleMCQSubmit}
						disabled={!state.selectedOption}
						className="col-span-full mt-2"
					>
						{t("quiz.checkAnswer")}
					</Button>
				</div>
			);
		}

		case "matching": {
			const body = question as Record<string, unknown>;
			const matchingPairs = (body.body as Record<string, unknown>)
				.pairs as Record<string, unknown>[];
			const pairs =
				matchingPairs?.map((p: Record<string, unknown>) => [
					p.left as string,
					p.right as string,
				]) ?? [];
			const table = {
				headers: [t("quiz.items"), t("quiz.match")],
				rows: pairs,
			};
			return (
				<MatchingInput
					table={table}
					onChange={(pairs: Record<string, unknown>) =>
						handleGrade({ type: "pairs", value: pairs })
					}
				/>
			);
		}

		case "short-answer": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<ShortAnswerInput
					value={textInputValue}
					onChange={setTextInputValue}
					maxLength={qBody.maxLength as number | undefined}
					onSubmit={(answer: string) =>
						handleGrade({ type: "text", value: answer })
					}
				/>
			);
		}

		case "long-answer": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<LongAnswerInput
					value={longAnswerValue}
					onChange={setLongAnswerValue}
					minWords={qBody.minWords as number | undefined}
					maxWords={qBody.maxWords as number | undefined}
					onSubmit={(answer: string) =>
						handleGrade({ type: "text", value: answer })
					}
				/>
			);
		}

		case "essay": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<EssayInput
					value={essayValue}
					onChange={setEssayValue}
					wordLimit={qBody.wordLimit as number | undefined}
					rubric={
						qBody.rubric as
							| { name: string; description: string; maxScore: number }[]
							| undefined
					}
					onSubmit={(answer: string) =>
						handleGrade({ type: "text", value: answer })
					}
				/>
			);
		}

		case "calculation": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<div className="flex flex-col gap-3">
					<CalculationInput
						value={calcValue}
						onChange={setCalcValue}
						unit={unitValue}
						onUnitChange={setUnitValue}
					/>
					{(qBody.unit as string | undefined) && (
						<p className="text-muted-foreground text-xs">
							Expected unit: {qBody.unit as string}
						</p>
					)}
					<Button
						onClick={() => {
							const numeric = parseFloat(calcValue);
							handleGrade({
								type: "numeric",
								value: Number.isNaN(numeric)
									? calcValue
									: { value: numeric, unit: unitValue || undefined },
							});
						}}
						disabled={!calcValue.trim()}
					>
						{t("quiz.submitAnswer")}
					</Button>
				</div>
			);
		}

		case "diagram": {
			const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;
				ctx.strokeStyle = "var(--system-foreground, #000)";
				ctx.lineWidth = 2;
				ctx.lineCap = "round";
				const rect = canvas.getBoundingClientRect();
				ctx.beginPath();
				ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
				setIsDrawing(true);
			};

			const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
				if (!isDrawing) return;
				const canvas = canvasRef.current;
				if (!canvas) return;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;
				const rect = canvas.getBoundingClientRect();
				ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
				ctx.stroke();
			};

			const stopDrawing = () => {
				setIsDrawing(false);
			};

			const clearCanvas = () => {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			};

			const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
				const file = e.target.files?.[0];
				if (!file) return;
				const reader = new FileReader();
				reader.onload = () => {
					setUploadedImage(reader.result as string);
				};
				reader.readAsDataURL(file);
			};

			const submitDiagram = () => {
				if (diagramMode === "draw" && canvasRef.current) {
					handleGrade({
						type: "text",
						value: canvasRef.current.toDataURL(),
					});
				} else if (diagramMode === "upload" && uploadedImage) {
					handleGrade({
						type: "text",
						value: uploadedImage,
					});
				}
			};

			return (
				<div className="flex flex-col gap-3">
					<div
						className="flex gap-2"
						role="tablist"
						aria-label="Diagram input mode"
					>
						<Button
							variant={diagramMode === "draw" ? "default" : "ghost"}
							size="sm"
							onClick={() => setDiagramMode("draw")}
							role="tab"
							aria-selected={diagramMode === "draw"}
							aria-label="Draw diagram"
						>
							Draw
						</Button>
						<Button
							variant={diagramMode === "upload" ? "default" : "ghost"}
							size="sm"
							onClick={() => setDiagramMode("upload")}
							role="tab"
							aria-selected={diagramMode === "upload"}
							aria-label="Upload image"
						>
							Upload
						</Button>
					</div>
					{diagramMode === "draw" ? (
						<div className="overflow-hidden rounded-lg border">
							<canvas
								ref={canvasRef}
								width={400}
								height={300}
								className="w-full max-w-md cursor-crosshair"
								onMouseDown={startDrawing}
								onMouseMove={draw}
								onMouseUp={stopDrawing}
								onMouseLeave={stopDrawing}
								aria-label="Draw your diagram"
								role="img"
							/>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							<Input
								type="file"
								accept="image/*"
								onChange={handleFileUpload}
								aria-label="Upload diagram image"
							/>
							{uploadedImage && (
								// biome-ignore lint/performance/noImgElement: data URL from user upload
								<img
									src={uploadedImage}
									alt="Uploaded diagram preview"
									className="max-w-md rounded-lg border"
								/>
							)}
						</div>
					)}
					<div className="flex gap-2">
						{diagramMode === "draw" && (
							<Button
								variant="outline"
								size="sm"
								onClick={clearCanvas}
								aria-label="Clear canvas"
							>
								Clear
							</Button>
						)}
						<Button
							size="sm"
							onClick={submitDiagram}
							disabled={diagramMode === "upload" && !uploadedImage}
						>
							Submit
						</Button>
					</div>
				</div>
			);
		}

		case "programming": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<div className="flex flex-col gap-3">
					<ProgrammingInput
						value={code}
						onChange={setCode}
						language={qBody.language as string | undefined}
						starterCode={qBody.starterCode as string | undefined}
					/>
					<Button
						onClick={() => handleGrade({ type: "code", value: code })}
						disabled={!code.trim()}
					>
						{t("quiz.submitAnswer")}
					</Button>
				</div>
			);
		}

		case "source-based": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<SourceBasedInput
					body={qBody}
					effectiveSubject={effectiveSubject}
					onGrade={handleGrade}
				/>
			);
		}

		case "data-response": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return <DataResponseInput body={qBody} onGrade={handleGrade} />;
		}

		case "mixed": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			const parts = qBody.parts as Record<string, unknown>[] | undefined;
			return <MixedPartsInput parts={parts} onGrade={handleGrade} />;
		}

		default:
			return (
				<p className="text-muted-foreground text-sm">
					{t("quiz.unsupportedType")}
				</p>
			);
	}
}
