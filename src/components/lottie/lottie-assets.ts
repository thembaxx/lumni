import achievementUnlockData from "@/assets/animations/achievement-unlock.json";
import confettiData from "@/assets/animations/confetti.json";
import levelUpData from "@/assets/animations/level-up.json";
import loadingDotsData from "@/assets/animations/loading-dots.json";
import streakFireData from "@/assets/animations/streak-fire.json";
import successCheckData from "@/assets/animations/success-check.json";

export const LOTTIE_ANIMATIONS = {
	"achievement-unlock": achievementUnlockData,
	"level-up": levelUpData,
	confetti: confettiData,
	"success-check": successCheckData,
	"loading-dots": loadingDotsData,
	"streak-fire": streakFireData,
} as const;

export type LottieAnimationName = keyof typeof LOTTIE_ANIMATIONS;
