import type { CardStatus } from "@/lib/flashcard-repository/types";

export interface LeechConfig {
	threshold: number;
	action: "suspend" | "bury" | "tag-only";
}

export interface LeechResult {
	isLeech: boolean;
	newStatus: CardStatus | null;
	actionTaken: "suspend" | "bury" | "tag-only" | null;
}

export function checkLeech(
	lapses: number,
	_currentStatus: CardStatus,
	alreadyLeeched: boolean,
	config: LeechConfig,
): LeechResult {
	if (alreadyLeeched) {
		return { isLeech: false, newStatus: null, actionTaken: null };
	}

	if (lapses < config.threshold) {
		return { isLeech: false, newStatus: null, actionTaken: null };
	}

	switch (config.action) {
		case "suspend":
			return {
				isLeech: true,
				newStatus: "suspended",
				actionTaken: "suspend",
			};
		case "bury":
			return {
				isLeech: true,
				newStatus: "buried",
				actionTaken: "bury",
			};
		case "tag-only":
			return {
				isLeech: true,
				newStatus: null,
				actionTaken: "tag-only",
			};
	}
}
