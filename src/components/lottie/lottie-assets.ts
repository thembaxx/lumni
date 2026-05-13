import { ANIMATION_SOURCES } from "./animation-sources";

export type LottieAnimationName = keyof typeof ANIMATION_SOURCES;

export function getAnimationSrc(name: LottieAnimationName): string {
	return ANIMATION_SOURCES[name];
}
