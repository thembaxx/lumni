export const appConfig = {
	name: "Lumni",
	shortName: "Lumni",
	descriptionShort: "Pass your Matric with confidence.",
	description:
		"Pass your Matric with confidence. Lumni is your AI-powered study companion, offering personalized quizzes, flashcards, past papers, and a smart study planner to help you ace your exams.",
	version: {
		current: "1.0.0",
		build: process.env.NEXT_PUBLIC_BUILD_VERSION || "dev",
		commit: process.env.NEXT_PUBLIC_COMMIT_HASH || "unknown",
		timestamp: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || "",
	},
	links: {
		website: "https://lumni.ai",
		support: "https://lumni.ai/support",
		privacy: "https://lumni.ai/privacy",
		terms: "https://lumni.ai/terms",
		feedback: "https://lumni.ai/feedback",
	},
	contact: {
		email: "hello@lumni.ai",
		supportEmail: "support@lumni.ai",
		phone: "+27 21 123 4567",
		whatsapp: "+27 82 123 4567",
		hours: "Mon-Fri: 9AM-6PM SAST",
	},
	social: {
		facebook: "https://facebook.com/lumni",
		twitter: "https://twitter.com/lumni",
		instagram: "https://instagram.com/lumni",
		youtube: "https://youtube.com/@lumni",
	},
	nsc: {
		minAps: 20,
		maxAps: 50,
		defaultTargetAps: 42,
	},
	paths: {
		dashboard: "/dashboard",
		quiz: "/quiz",
		flashcards: "/flashcards",
		pastPapers: "/past-papers",
		studyPlan: "/study-plan",
		settings: "/settings",
	},
};
