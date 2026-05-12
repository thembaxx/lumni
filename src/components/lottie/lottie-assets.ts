import achievementUnlockData from "@/assets/animations/achievement-unlock.json";
import confettiData from "@/assets/animations/confetti.json";
import emptySearchData from "@/assets/animations/empty-search.json";
import emptyUploadData from "@/assets/animations/empty-upload.json";
import errorStateData from "@/assets/animations/error-state.json";
import levelUpData from "@/assets/animations/level-up.json";
import loadingDotsData from "@/assets/animations/loading-dots.json";
import loadingLumniData from "@/assets/animations/loading-lumni.json";
import page404Data from "@/assets/animations/page-404.json";
import quizCorrectData from "@/assets/animations/quiz-correct.json";
import quizIncorrectData from "@/assets/animations/quiz-incorrect.json";
import streakFireData from "@/assets/animations/streak-fire.json";
import successCheckData from "@/assets/animations/success-check.json";
import xpBurstData from "@/assets/animations/xp-burst.json";

export const LOTTIE_ANIMATIONS = {
	"achievement-unlock": achievementUnlockData,
	"level-up": levelUpData,
	confetti: confettiData,
	"success-check": successCheckData,
	"loading-dots": loadingDotsData,
	"loading-lumni": loadingLumniData,
	"page-404": page404Data,
	"quiz-correct": quizCorrectData,
	"quiz-incorrect": quizIncorrectData,
	"streak-fire": streakFireData,
	"xp-burst": xpBurstData,
	"empty-search": emptySearchData,
	"empty-upload": emptyUploadData,
	"error-state": errorStateData,
} as const;

export type LottieAnimationName = keyof typeof LOTTIE_ANIMATIONS;
