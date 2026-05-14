"use client";

import {
	ArrowsClockwise,
	Check,
	Microphone,
	Pause,
	Play,
	SpeakerHigh,
	Square,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTTS, useVoiceRecorder } from "@/hooks/use-tts";
import {
	type PronunciationExercise,
	SUPPORTED_LANGUAGES,
} from "@/lib/utils/tts-service";

export function PronunciationPractice() {
	const { isSupported, speak, isSpeaking, availableLanguages } = useTTS();
	const {
		isRecording,
		recordingTime,
		startRecording,
		stopRecording,
		clearRecording,
		audioBlob,
	} = useVoiceRecorder();
	const [selectedLang, setSelectedLang] = useState("en-US");
	const [currentExercise, setCurrentExercise] =
		useState<PronunciationExercise | null>(null);
	const [exercises, setExercises] = useState<PronunciationExercise[]>([]);
	const [completed, setCompleted] = useState<Set<string>>(new Set());

	if (!isSupported) {
		return (
			<div className="text-center py-8">
				<p className="text-muted-foreground">
					Text-to-speech is not supported in your browser.
				</p>
			</div>
		);
	}

	const loadExercises = (lang: string) => {
		const langCode = lang.split("-")[0];
		const langExercises = getLanguageExercises(langCode);
		setExercises(langExercises);
		setCurrentExercise(langExercises[0] || null);
	};

	const handleLanguageChange = (lang: string) => {
		setSelectedLang(lang);
		setCompleted(new Set());
		loadExercises(lang);
	};

	const handlePlay = async () => {
		if (currentExercise) {
			await speak(currentExercise.text, { lang: selectedLang });
		}
	};

	const handleRecord = () => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	};

	const nextExercise = () => {
		const currentIndex = exercises.findIndex(
			(e) => e.id === currentExercise?.id,
		);
		if (currentIndex < exercises.length - 1) {
			setCurrentExercise(exercises[currentIndex + 1]);
		} else {
			setCurrentExercise(exercises[0]);
		}
		clearRecording();
	};

	const markComplete = () => {
		if (currentExercise) {
			setCompleted((prev) => new Set([...prev, currentExercise.id]));
		}
		nextExercise();
	};

	const progress =
		exercises.length > 0
			? Math.round((completed.size / exercises.length) * 100)
			: 0;

	return (
		<div className="flex flex-col gap-6 max-w-2xl mx-auto">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Pronunciation Practice</h2>
				<div className="flex gap-2">
					{availableLanguages.map((lang) => (
						<Button
							key={lang.code}
							variant={selectedLang === lang.code ? "default" : "outline"}
							size="sm"
							onClick={() => handleLanguageChange(lang.code)}
						>
							{lang.flag} {lang.code.split("-")[0].toUpperCase()}
						</Button>
					))}
				</div>
			</div>

			{progress > 0 && (
				<div className="flex flex-col gap-2">
					<div className="flex justify-between text-sm text-muted-foreground">
						<span>Progress</span>
						<span>
							{completed.size}/{exercises.length}
						</span>
					</div>
					<div className="h-2 bg-muted rounded-full overflow-hidden">
						<div
							className="h-full bg-[--system-accent] transition-[width] duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			)}

			{currentExercise ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span className="text-lg">
								Difficulty: {currentExercise.difficulty}
							</span>
							{completed.has(currentExercise.id) && (
								<span className="flex items-center gap-1 text-success">
									<Check data-icon /> Completed
								</span>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-6">
						<div className="text-center py-4">
							<p className="text-2xl font-medium mb-2">
								{currentExercise.text}
							</p>
							{currentExercise.translation && (
								<p className="text-muted-foreground">
									{currentExercise.translation}
								</p>
							)}
						</div>

						<div className="flex justify-center gap-4">
							<Button
								size="lg"
								variant="outline"
								onClick={handlePlay}
								disabled={isSpeaking}
								className="gap-2"
							>
								{isSpeaking ? <Pause data-icon /> : <SpeakerHigh data-icon />}
								{isSpeaking ? "Speaking..." : "Listen"}
							</Button>

							<Button
								size="lg"
								onClick={handleRecord}
								className={`gap-2 ${isRecording ? "bg-destructive hover:bg-destructive/90" : ""}`}
							>
								<Microphone data-icon />
								{isRecording ? `${recordingTime}s` : "Record"}
							</Button>
						</div>

						{audioBlob && (
							<div className="flex justify-center">
								<audio
									controls
									src={URL.createObjectURL(audioBlob)}
									className="w-full max-w-md"
								/>
							</div>
						)}

						<div className="flex justify-center gap-4 pt-4">
							<Button variant="outline" onClick={nextExercise}>
								<ArrowsClockwise data-icon />
								Skip
							</Button>
							<Button
								onClick={markComplete}
								disabled={completed.has(currentExercise.id)}
							>
								<Check data-icon />
								Mark Complete
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="text-center py-8">
					<p className="text-muted-foreground">Loading exercises...</p>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Tips</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="flex flex-col gap-2 text-sm text-muted-foreground">
						<li>• Click "Listen" to hear the correct pronunciation</li>
						<li>• Click "Record" and try to match the pronunciation</li>
						<li>• Listen to your recording and compare</li>
						<li>• Practice regularly for best results</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}

function getLanguageExercises(langCode: string): PronunciationExercise[] {
	const exercises: Record<string, PronunciationExercise[]> = {
		en: [
			{
				id: "e1",
				text: "The quick brown fox jumps over the lazy dog.",
				translation: "",
				difficulty: "easy",
			},
			{
				id: "e2",
				text: "She sells seashells by the seashore.",
				translation: "",
				difficulty: "medium",
			},
			{
				id: "e3",
				text: "Peter Piper picked a peck of pickled peppers.",
				translation: "",
				difficulty: "hard",
			},
			{
				id: "e4",
				text: "How much wood would a woodchuck chuck?",
				translation: "",
				difficulty: "medium",
			},
			{
				id: "e5",
				text: "I scream, you scream, we all scream for ice cream.",
				translation: "",
				difficulty: "easy",
			},
		],
		af: [
			{
				id: "a1",
				text: "Goeie more, hoe gaan dit?",
				translation: "Good morning, how are you?",
				difficulty: "easy",
			},
			{
				id: "a2",
				text: "Die son skyn vandag.",
				translation: "The sun is shining today.",
				difficulty: "easy",
			},
			{
				id: "a3",
				text: "Ek is 'n student by die universiteit.",
				translation: "I am a student at the university.",
				difficulty: "medium",
			},
			{
				id: "a4",
				text: "Die kat sit op die mat.",
				translation: "The cat sits on the mat.",
				difficulty: "easy",
			},
			{
				id: "a5",
				text: "My familie bly in Kaapstad.",
				translation: "My family lives in Cape Town.",
				difficulty: "medium",
			},
		],
	};

	return exercises[langCode] || exercises["en"];
}
