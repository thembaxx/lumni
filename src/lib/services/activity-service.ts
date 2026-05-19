export interface ActivityItem {
	id: string;
	type:
		| "quiz_completed"
		| "exam_completed"
		| "flashcard_review"
		| "achievement_unlocked"
		| "streak_milestone";
	label: string;
	description: string;
	timestamp: number;
	metadata?: Record<string, unknown>;
}

const ACTIVITY_KEY = "lumni_activity_feed";
const MAX_ITEMS = 50;

export function getActivityFeed(): ActivityItem[] {
	if (typeof window === "undefined") return [];
	const raw = localStorage.getItem(ACTIVITY_KEY);
	return raw ? JSON.parse(raw) : [];
}

export function addActivityItem(
	item: Omit<ActivityItem, "id" | "timestamp">,
): void {
	if (typeof window === "undefined") return;
	const feed = getActivityFeed();
	feed.unshift({
		...item,
		id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		timestamp: Date.now(),
	});
	localStorage.setItem(ACTIVITY_KEY, JSON.stringify(feed.slice(0, MAX_ITEMS)));
}
