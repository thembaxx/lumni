export const LOTTIE_ANIMATIONS = {
	"achievement-unlock": () =>
		import("@/assets/animations/achievement-unlock.json").then(
			(m) => m.default,
		),
	"level-up": () =>
		import("@/assets/animations/level-up.json").then((m) => m.default),
	confetti: () =>
		import("@/assets/animations/confetti.json").then((m) => m.default),
	"success-check": () =>
		import("@/assets/animations/success-check.json").then((m) => m.default),
	"loading-dots": () =>
		import("@/assets/animations/loading-dots.json").then((m) => m.default),
	"loading-lumni": () =>
		import("@/assets/animations/loading-lumni.json").then((m) => m.default),
	"page-404": () =>
		import("@/assets/animations/page-404.json").then((m) => m.default),
	"quiz-correct": () =>
		import("@/assets/animations/quiz-correct.json").then((m) => m.default),
	"quiz-incorrect": () =>
		import("@/assets/animations/quiz-incorrect.json").then((m) => m.default),
	"streak-fire": () =>
		import("@/assets/animations/streak-fire.json").then((m) => m.default),
	"xp-burst": () =>
		import("@/assets/animations/xp-burst.json").then((m) => m.default),
	"empty-search": () =>
		import("@/assets/animations/empty-search.json").then((m) => m.default),
	"empty-upload": () =>
		import("@/assets/animations/empty-upload.json").then((m) => m.default),
	"error-state": () =>
		import("@/assets/animations/error-state.json").then((m) => m.default),
} as const;

export type LottieAnimationName = keyof typeof LOTTIE_ANIMATIONS;

export function loadAnimationData(name: LottieAnimationName): Promise<Record<string, unknown>> {
	return LOTTIE_ANIMATIONS[name]();
}
