export interface SRSettings {
	learningSteps: number[];
	dailyNewLimit: number;
	dailyReviewLimit: number;
	leechThreshold: number;
	leechAction: "suspend" | "bury" | "tag-only";
	easeHellPasses: number;
	easeHellBoost: number;
}

export const DEFAULT_SR_SETTINGS: SRSettings = {
	learningSteps: [1, 10, 1440],
	dailyNewLimit: 20,
	dailyReviewLimit: 200,
	leechThreshold: 8,
	leechAction: "suspend",
	easeHellPasses: 3,
	easeHellBoost: 0.15,
};

export const SR_SETTINGS_KEY = "lumni_sr_settings";
