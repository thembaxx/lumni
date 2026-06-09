"use client";

import { Mic01Icon, StopCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { audioEngine } from "@/lib/audio-engine";
import { getWhisperService } from "@/lib/audio-engine/whisper-service";
import { logError } from "@/lib/shared/logger";

interface WordScore {
	word: string;
	accuracy: number;
	isCorrect: boolean;
}

export function PronunciationClient() {
	const [expectedText, setExpectedText] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const [hasRecording, setHasRecording] = useState(false);
	const [transcribedText, setTranscribedText] = useState<string | null>(null);
	const [assessment, setAssessment] = useState<{
		overallScore: number;
		wordScores: WordScore[];
		fluencyScore: number;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [permission, setPermission] = useState(false);
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [modelState, setModelState] = useState<
		"idle" | "downloading" | "loaded" | "error"
	>("idle");
	const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		const unsub = audioEngine.subscribe(() => {
			const state = audioEngine.getState();
			setIsRecording(state.isRecording);
			setHasRecording(!!state.audioBlob);
		});
		return unsub;
	}, []);

	const pollProgress = useCallback(() => {
		const svc = getWhisperService();
		svc.onDownloadProgress((pct) => {
			setDownloadProgress(pct);
		});
		progressInterval.current = setInterval(() => {
			const pct = svc.getDownloadProgress();
			setDownloadProgress(pct);
			if (pct >= 100 || svc.getLoadState() === "loaded") {
				setModelState("loaded");
				if (progressInterval.current) {
					clearInterval(progressInterval.current);
				}
			}
		}, 200);
	}, []);

	const requestPermission = useCallback(async () => {
		try {
			await audioEngine.requestPermission();
			setPermission(true);
		} catch {
			logError("PronunciationClient.permission", new Error("Mic denied"));
		}
	}, []);

	const handleRecord = useCallback(async () => {
		if (!permission) {
			await requestPermission();
		}
		const state = audioEngine.getState();
		if (state.isRecording) {
			audioEngine.stopRecording();
			return;
		}
		try {
			audioEngine.resetRecording();
			await audioEngine.startRecording();
		} catch (err) {
			logError("PronunciationClient.record", err);
		}
	}, [permission, requestPermission]);

	const handleTranscribe = useCallback(async () => {
		const result = audioEngine.getRecordingResult();
		if (!result) return;

		setLoading(true);
		setModelState("downloading");
		pollProgress();

		try {
			const service = getWhisperService();
			const transcription = await service.transcribe(result.blob);
			if (transcription) {
				setTranscribedText(transcription.text);
				if (expectedText.trim()) {
					const scored = service.assessPronunciation(
						transcription.text,
						expectedText,
					);
					setAssessment(scored);
				}
			}
		} catch (err) {
			logError("PronunciationClient.transcribe", err);
		} finally {
			setLoading(false);
			if (progressInterval.current) {
				clearInterval(progressInterval.current);
			}
		}
	}, [expectedText, pollProgress]);

	const handleReset = useCallback(() => {
		setTranscribedText(null);
		setAssessment(null);
		setExpectedText("");
		audioEngine.resetRecording();
		setHasRecording(false);
		setModelState("idle");
		setDownloadProgress(0);
	}, []);

	return (
		<PageContainer className="gap-6 pt-8">
			<div className="flex flex-col gap-2">
				<h1 className="font-extrabold text-2xl tracking-tight">
					Pronunciation Practice
				</h1>
				<p className="text-muted-foreground text-sm">
					Type a phrase, record yourself, and get feedback on your pronunciation
				</p>
			</div>

			{modelState === "downloading" && (
				<Card className="overflow-hidden rounded-3xl border-info/20 bg-info/5 shadow-level-1">
					<CardContent className="flex flex-col gap-3 p-5">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-sm">
								Downloading speech model...
							</span>
							<span className="text-muted-foreground text-xs tabular-nums">
								{downloadProgress}%
							</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-[--system-accent] transition-[width] duration-300"
								style={{ width: `${downloadProgress}%` }}
							/>
						</div>
						<p className="text-muted-foreground text-xs">
							~74MB download (one-time). This enables offline speech recognition
							in 99+ languages including Afrikaans, isiZulu, and isiXhosa.
						</p>
					</CardContent>
				</Card>
			)}

			{modelState === "error" && (
				<Card className="overflow-hidden rounded-3xl border-destructive/20 bg-destructive/5 shadow-level-1">
					<CardContent className="p-5">
						<p className="font-semibold text-destructive text-sm">
							Failed to load speech model
						</p>
						<p className="text-muted-foreground text-xs">
							Check your internet connection and try again.
						</p>
					</CardContent>
				</Card>
			)}

			<Card className="overflow-hidden rounded-3xl shadow-level-1">
				<CardHeader>
					<CardTitle className="font-extrabold text-lg">
						What to practice
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 p-5 pt-0">
					<Textarea
						value={expectedText}
						onChange={(e) => setExpectedText(e.target.value)}
						placeholder="Type a word or phrase to practice..."
						className="min-h-[80px] resize-none rounded-2xl text-base"
						aria-label="Text to practice"
					/>
				</CardContent>
			</Card>

			<div className="flex flex-wrap items-center gap-3">
				<Button
					variant={isRecording ? "destructive" : "default"}
					size="lg"
					onClick={handleRecord}
					className={
						isRecording ? "animate-pulse rounded-full" : "rounded-full"
					}
					aria-label={isRecording ? "Stop recording" : "Start recording"}
				>
					<HugeiconsIcon
						icon={isRecording ? StopCircleIcon : Mic01Icon}
						className="size-5"
					/>
					{isRecording ? "Stop Recording" : "Start Recording"}
				</Button>

				{hasRecording && !isRecording && (
					<Button
						variant="outline"
						size="lg"
						onClick={handleTranscribe}
						disabled={loading}
						className="rounded-full"
					>
						{loading ? "Transcribing..." : "Analyze Pronunciation"}
					</Button>
				)}

				{(transcribedText || assessment) && (
					<Button
						variant="ghost"
						size="lg"
						onClick={handleReset}
						className="rounded-full"
					>
						Try Again
					</Button>
				)}
			</div>

			{transcribedText && (
				<m.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
				>
					<Card className="overflow-hidden rounded-3xl shadow-level-1">
						<CardHeader>
							<CardTitle className="font-extrabold text-lg">
								Transcription
							</CardTitle>
						</CardHeader>
						<CardContent className="p-5 pt-0">
							<p className="leading-relaxed">{transcribedText}</p>
						</CardContent>
					</Card>
				</m.div>
			)}

			{assessment && (
				<m.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
				>
					<Card className="overflow-hidden rounded-3xl shadow-level-1">
						<CardHeader>
							<CardTitle className="font-extrabold text-lg">
								Pronunciation Assessment
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-5 p-5 pt-0">
							<div className="grid grid-cols-2 gap-4">
								<div className="rounded-2xl bg-info/10 p-4 text-center">
									<div className="font-extrabold text-3xl text-info tabular-nums">
										{assessment.overallScore}%
									</div>
									<div className="mt-1 text-muted-foreground text-xs">
										Accuracy
									</div>
								</div>
								<div className="rounded-2xl bg-warning/10 p-4 text-center">
									<div className="font-extrabold text-3xl text-warning tabular-nums">
										{assessment.fluencyScore}%
									</div>
									<div className="mt-1 text-muted-foreground text-xs">
										Fluency
									</div>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<span className="font-semibold text-sm">
									Word-by-word breakdown
								</span>
								<div className="flex flex-wrap gap-2">
									{assessment.wordScores.map((ws) => (
										<Badge
											key={ws.word}
											variant="outline"
											className={`rounded-full px-3 py-1 text-sm ${
												ws.isCorrect
													? "border-success/30 bg-success/10 text-success"
													: "border-destructive/30 bg-destructive/10 text-destructive"
											}`}
										>
											{ws.word}
										</Badge>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				</m.div>
			)}
		</PageContainer>
	);
}
