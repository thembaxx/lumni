import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";

interface LeaderboardEntry {
	rank: number;
	label: string;
	xp: number;
	streak: number;
	isCurrentUser: boolean;
}

const LEADERBOARD_KEY = "lumni_leaderboard_history";

export function getWeeklyLeaderboard(): LeaderboardEntry[] {
	const currentXp = loadFromStorage<number>("lumni_total_xp", 0);
	const currentStreak = loadFromStorage<number>("lumni_streak", 0);

	const data = loadFromStorage<
		Array<{ label: string; xp: number; streak: number; timestamp: number }>
	>(LEADERBOARD_KEY, []);

	const now = Date.now();
	const oneWeek = 7 * 24 * 60 * 60 * 1000;
	const recent = data.filter((d) => now - d.timestamp < oneWeek);

	const entries: LeaderboardEntry[] = [
		{
			rank: 1,
			label: "This Week (You)",
			xp: currentXp,
			streak: currentStreak,
			isCurrentUser: true,
		},
		...recent
			.filter((d) => d.label !== "This Week (You)")
			.sort((a, b) => b.xp - a.xp)
			.slice(0, 9)
			.map((d, i) => ({
				rank: i + 2,
				label: d.label,
				xp: d.xp,
				streak: d.streak,
				isCurrentUser: false,
			})),
	];

	return entries;
}

export function saveWeeklySnapshot(label: string, xp: number, streak: number): void {
	const data = loadFromStorage<
		Array<{ label: string; xp: number; streak: number; timestamp: number }>
	>(LEADERBOARD_KEY, []);

	data.push({ label, xp, streak, timestamp: Date.now() });
	saveToStorage(LEADERBOARD_KEY, data.slice(-100));
}
