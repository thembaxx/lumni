export interface UserGamification {
	xp: number;
	level: number;
	totalXp: number;
	achievements: Achievement[];
	dailyChallenges: DailyChallenge[];
	streakMilestones: StreakMilestone[];
	lastPracticeDate: string | null;
}

export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	earnedAt: string | null;
	xpReward: number;
	rarity: "common" | "rare" | "epic" | "legendary";
	category: "streak" | "accuracy" | "volume" | "subject" | "special";
	requirement: number;
}

export interface DailyChallenge {
	id: string;
	title: string;
	description: string;
	icon: string;
	xpReward: number;
	target: number;
	progress: number;
	completed: boolean;
	expiresAt: string;
	type: "questions" | "accuracy" | "streak" | "subject";
}

export interface StreakMilestone {
	streak: number;
	reward: string;
	unlocked: boolean;
}

export interface LevelInfo {
	level: number;
	currentXp: number;
	xpToNextLevel: number;
	progress: number;
	title: string;
}

export const XP_PER_QUESTION = 10;
export const XP_PER_CORRECT = 5;
export const XP_STREAK_BONUS = 20;
export const XP_DAILY_COMPLETE = 50;
export const XP_STREAK_FREEZE_REWARD = 25;

export const LEVELS = [
	{ level: 1, title: "Beginner", xpRequired: 0 },
	{ level: 2, title: "Learner", xpRequired: 100 },
	{ level: 3, title: "Student", xpRequired: 250 },
	{ level: 4, title: "Scholar", xpRequired: 500 },
	{ level: 5, title: "Acolyte", xpRequired: 850 },
	{ level: 6, title: "Expert", xpRequired: 1200 },
	{ level: 7, title: "Master", xpRequired: 1700 },
	{ level: 8, title: "Sage", xpRequired: 2300 },
	{ level: 9, title: "Virtuoso", xpRequired: 3000 },
	{ level: 10, title: "Champion", xpRequired: 3800 },
	{ level: 11, title: "Legend", xpRequired: 4700 },
	{ level: 12, title: "Grandmaster", xpRequired: 5700 },
];

export const ACHIEVEMENTS: Achievement[] = [
	{
		id: "first_question",
		name: "First Steps",
		description: "Answer your first question",
		icon: "🎯",
		earnedAt: null,
		xpReward: 25,
		rarity: "common",
		category: "volume",
		requirement: 1,
	},
	{
		id: "streak_3",
		name: "On Fire",
		description: "Maintain a 3-day streak",
		icon: "🔥",
		earnedAt: null,
		xpReward: 50,
		rarity: "common",
		category: "streak",
		requirement: 3,
	},
	{
		id: "streak_7",
		name: "Week Warrior",
		description: "Maintain a 7-day streak",
		icon: "💪",
		earnedAt: null,
		xpReward: 100,
		rarity: "rare",
		category: "streak",
		requirement: 7,
	},
	{
		id: "streak_30",
		name: "Unstoppable",
		description: "Maintain a 30-day streak",
		icon: "🏆",
		earnedAt: null,
		xpReward: 500,
		rarity: "epic",
		category: "streak",
		requirement: 30,
	},
	{
		id: "questions_50",
		name: "Dedicated",
		description: "Answer 50 questions",
		icon: "📚",
		earnedAt: null,
		xpReward: 75,
		rarity: "common",
		category: "volume",
		requirement: 50,
	},
	{
		id: "questions_100",
		name: "Scholar",
		description: "Answer 100 questions",
		icon: "🎓",
		earnedAt: null,
		xpReward: 150,
		rarity: "rare",
		category: "volume",
		requirement: 100,
	},
	{
		id: "questions_500",
		name: "Expert",
		description: "Answer 500 questions",
		icon: "⭐",
		earnedAt: null,
		xpReward: 300,
		rarity: "epic",
		category: "volume",
		requirement: 500,
	},
	{
		id: "accuracy_80",
		name: "Sharp Mind",
		description: "Achieve 80% accuracy",
		icon: "🧠",
		earnedAt: null,
		xpReward: 100,
		rarity: "rare",
		category: "accuracy",
		requirement: 80,
	},
	{
		id: "accuracy_90",
		name: "Perfectionist",
		description: "Achieve 90% accuracy",
		icon: "💎",
		earnedAt: null,
		xpReward: 200,
		rarity: "epic",
		category: "accuracy",
		requirement: 90,
	},
	{
		id: "perfect_quiz",
		name: "Flawless",
		description: "Complete a quiz with 100% accuracy",
		icon: "✨",
		earnedAt: null,
		xpReward: 150,
		rarity: "rare",
		category: "special",
		requirement: 1,
	},
	{
		id: "level_5",
		name: "Rising Star",
		description: "Reach level 5",
		icon: "🌟",
		earnedAt: null,
		xpReward: 200,
		rarity: "rare",
		category: "special",
		requirement: 5,
	},
	{
		id: "level_10",
		name: "Mastery",
		description: "Reach level 10",
		icon: "👑",
		earnedAt: null,
		xpReward: 500,
		rarity: "legendary",
		category: "special",
		requirement: 10,
	},
	{
		id: "subject_math_50",
		name: "Math Whiz",
		description: "Answer 50 math questions",
		icon: "🔢",
		earnedAt: null,
		xpReward: 75,
		rarity: "common",
		category: "subject",
		requirement: 50,
	},
	{
		id: "subject_math_200",
		name: "Math Master",
		description: "Answer 200 math questions",
		icon: "🎲",
		earnedAt: null,
		xpReward: 200,
		rarity: "epic",
		category: "subject",
		requirement: 200,
	},
	{
		id: "subject_science_50",
		name: "Science Star",
		description: "Answer 50 science questions",
		icon: "🔬",
		earnedAt: null,
		xpReward: 75,
		rarity: "common",
		category: "subject",
		requirement: 50,
	},
	{
		id: "subject_science_200",
		name: "Science Sage",
		description: "Answer 200 science questions",
		icon: "🧪",
		earnedAt: null,
		xpReward: 200,
		rarity: "epic",
		category: "subject",
		requirement: 200,
	},
	{
		id: "subject_language_50",
		name: "Wordsmith",
		description: "Answer 50 language questions",
		icon: "📖",
		earnedAt: null,
		xpReward: 75,
		rarity: "common",
		category: "subject",
		requirement: 50,
	},
	{
		id: "subject_language_200",
		name: "Linguist",
		description: "Answer 200 language questions",
		icon: "🗣️",
		earnedAt: null,
		xpReward: 200,
		rarity: "epic",
		category: "subject",
		requirement: 200,
	},
	{
		id: "subject_commerce_50",
		name: "Trader",
		description: "Answer 50 commerce questions",
		icon: "💼",
		earnedAt: null,
		xpReward: 75,
		rarity: "common",
		category: "subject",
		requirement: 50,
	},
	{
		id: "subject_commerce_200",
		name: "Tycoon",
		description: "Answer 200 commerce questions",
		icon: "📊",
		earnedAt: null,
		xpReward: 200,
		rarity: "epic",
		category: "subject",
		requirement: 200,
	},
	{
		id: "subjects_all_5",
		name: "Polyglot",
		description: "Answer questions in 5 different subjects",
		icon: "🌍",
		earnedAt: null,
		xpReward: 150,
		rarity: "rare",
		category: "subject",
		requirement: 5,
	},
];

export const STREAK_MILESTONES: StreakMilestone[] = [
	{ streak: 3, reward: "First badge earned!", unlocked: false },
	{ streak: 7, reward: "Week Warrior badge unlocked!", unlocked: false },
	{ streak: 14, reward: "2x XP boost for a day!", unlocked: false },
	{ streak: 30, reward: "Unstoppable badge + 200 XP!", unlocked: false },
	{ streak: 60, reward: "Legendary aura effect!", unlocked: false },
	{ streak: 100, reward: "Grandmaster title unlocked!", unlocked: false },
];

export function calculateLevel(totalXp: number): LevelInfo {
	let currentLevel = LEVELS[0];
	let nextLevel = LEVELS[1];

	for (let i = 0; i < LEVELS.length - 1; i++) {
		if (totalXp >= LEVELS[i].xpRequired && totalXp < LEVELS[i + 1].xpRequired) {
			currentLevel = LEVELS[i];
			nextLevel = LEVELS[i + 1];
			break;
		}
		if (totalXp >= LEVELS[LEVELS.length - 1].xpRequired) {
			currentLevel = LEVELS[LEVELS.length - 1];
			nextLevel = LEVELS[LEVELS.length - 1];
		}
	}

	const xpInCurrentLevel = totalXp - currentLevel.xpRequired;
	const xpNeeded = nextLevel.xpRequired - currentLevel.xpRequired;
	const progress =
		nextLevel.level === currentLevel.level
			? 100
			: (xpInCurrentLevel / xpNeeded) * 100;

	return {
		level: currentLevel.level,
		currentXp: xpInCurrentLevel,
		xpToNextLevel: xpNeeded,
		progress: Math.min(progress, 100),
		title: currentLevel.title,
	};
}

export interface RewardChestDef {
	id: string;
	name: string;
	description: string;
	xpRequired: number;
	xpReward: number;
	icon: string;
	rarity: "common" | "rare" | "epic" | "legendary";
}

export const REWARD_CHESTS: RewardChestDef[] = [
	{
		id: "chest_500",
		name: "Wooden Chest",
		description: "Reach 500 total XP",
		xpRequired: 500,
		xpReward: 50,
		icon: "🪵",
		rarity: "common",
	},
	{
		id: "chest_1000",
		name: "Bronze Chest",
		description: "Reach 1,000 total XP",
		xpRequired: 1000,
		xpReward: 100,
		icon: "🥉",
		rarity: "common",
	},
	{
		id: "chest_2500",
		name: "Silver Chest",
		description: "Reach 2,500 total XP",
		xpRequired: 2500,
		xpReward: 200,
		icon: "🥈",
		rarity: "rare",
	},
	{
		id: "chest_5000",
		name: "Golden Chest",
		description: "Reach 5,000 total XP",
		xpRequired: 5000,
		xpReward: 400,
		icon: "🥇",
		rarity: "rare",
	},
	{
		id: "chest_10000",
		name: "Crystal Chest",
		description: "Reach 10,000 total XP",
		xpRequired: 10000,
		xpReward: 800,
		icon: "💎",
		rarity: "epic",
	},
	{
		id: "chest_25000",
		name: "Obsidian Chest",
		description: "Reach 25,000 total XP",
		xpRequired: 25000,
		xpReward: 1500,
		icon: "🪨",
		rarity: "legendary",
	},
];

export function generateDailyChallenges(): DailyChallenge[] {
	const today = new Date().toDateString();
	const challenges: DailyChallenge[] = [
		{
			id: "daily_questions",
			title: "Daily Grind",
			description: "Answer 10 questions today",
			icon: "📝",
			xpReward: XP_DAILY_COMPLETE,
			target: 10,
			progress: 0,
			completed: false,
			expiresAt: today,
			type: "questions",
		},
		{
			id: "daily_accuracy",
			title: "Precision",
			description: "Achieve 70% accuracy in a session",
			icon: "🎯",
			xpReward: 40,
			target: 70,
			progress: 0,
			completed: false,
			expiresAt: today,
			type: "accuracy",
		},
		{
			id: "daily_streak",
			title: "Keep the Flame",
			description: "Practice on consecutive days",
			icon: "🔥",
			xpReward: 30,
			target: 2,
			progress: 1,
			completed: false,
			expiresAt: today,
			type: "streak",
		},
	];

	return challenges;
}
