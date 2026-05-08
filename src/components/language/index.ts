export { useTTS, useVoiceRecorder } from "@/hooks/use-tts";
export {
	getExercisesForLanguage,
	getLanguageForText,
	type PronunciationExercise,
	SUPPORTED_LANGUAGES,
	type TTSOptions,
	type TTSVoice,
	ttsService,
} from "@/lib/utils/tts-service";
export { PronunciationPractice } from "./pronunciation-practice";
