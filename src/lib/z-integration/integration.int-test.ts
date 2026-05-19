import { beforeEach, describe, expect, mock, test } from "bun:test";

// ── Helpers ──────────────────────────────────────────────────────────
function createInMemoryStore<T extends { id?: number }>() {
	const items: T[] = [];
	return {
		add: async (item: T) => {
			const id = items.length + 1;
			items.push({ ...item, id } as unknown as T);
			return id;
		},
		get: async (id: number) => items.find((i) => i.id === id),
		update: async (id: number, changes: Partial<T>) => {
			const idx = items.findIndex((i) => i.id === id);
			if (idx !== -1) Object.assign(items[idx], changes);
			return 1;
		},
		where: (index: string) => ({
			equals: (value: string) => ({
				first: async () =>
					items.find((i) => (i as Record<string, unknown>)[index] === value),
				count: async () =>
					items.filter((i) => (i as Record<string, unknown>)[index] === value)
						.length,
				toArray: async () =>
					items.filter((i) => (i as Record<string, unknown>)[index] === value),
			}),
		}),
		toArray: async () => [...items],
		_items: items,
	};
}

const cannedQuestion = {
	id: "q1",
	type: "multiple-choice",
	subject: "mathematics",
	topic: "algebra",
	difficulty: "Easy",
	bloomTaxonomy: "remember" as const,
	points: 1,
	questionText: "What is 2 + 2?",
	hint: "Try counting on your fingers",
	explanation: "2 + 2 equals 4",
	steps: ["Add 2 and 2 together", "The result is 4"],
	body: {
		options: [
			{ id: "A", text: "3", isCorrect: false },
			{ id: "B", text: "4", isCorrect: true },
			{ id: "C", text: "5", isCorrect: false },
			{ id: "D", text: "6", isCorrect: false },
		],
		correctOptionId: "B",
		allowMultiple: false,
	},
};

const sampleAiResponse = {
	content: JSON.stringify([cannedQuestion]),
	provider: "gemini",
	available: true,
};

// ── Mock factories ───────────────────────────────────────────────────
const mockGenerateWithSystem = mock(() => sampleAiResponse);
const mockGetAI = mock(() => ({
	generateWithSystem: mockGenerateWithSystem,
}));
const mockInitAI = mock(() => {});
const mockIsAIConfigured = mock(() => true);

mock.module("@/lib/ai", () => ({
	getAI: mockGetAI,
	initAI: mockInitAI,
	isAIConfigured: mockIsAIConfigured,
	generateWithSystem: mockGenerateWithSystem,
	AIClient: class {},
}));

const mockDailyCheck = mock(() => ({
	allowed: true,
	remaining: { user: 20, global: 2000 },
	resetAt: Date.now() + 86400000,
}));
const mockDailyIncrement = mock(() => {});

mock.module("@/lib/ai/daily-call-tracker", () => ({
	dailyCallTracker: {
		check: mockDailyCheck,
		increment: mockDailyIncrement,
	},
	DailyCallTracker: class {},
}));

const mockJobsStore = createInMemoryStore();
const mockQuestionsStore = createInMemoryStore();
const mockVisualsStore = createInMemoryStore();
const mockCompetenciesStore = createInMemoryStore();
const mockWrongAnswersStore = createInMemoryStore();
const mockQuestionRatingsStore = createInMemoryStore();

mock.module("@/lib/db/schema", () => ({
	offlineDB: {
		jobs: mockJobsStore,
		questions: mockQuestionsStore,
		visuals: mockVisualsStore,
		competencies: mockCompetenciesStore,
		wrongAnswers: mockWrongAnswersStore,
		questionRatings: mockQuestionRatingsStore,
		progress: createInMemoryStore(),
		syncQueue: createInMemoryStore(),
		quizSessions: createInMemoryStore(),
	},
	LumniOfflineDB: class {},
}));

const mockGetCachedQuestions = mock(() => null);
const mockCacheQuestions = mock(() => {});

mock.module("@/lib/db/repositories/question-cache", () => ({
	getCachedQuestions: mockGetCachedQuestions,
	cacheQuestions: mockCacheQuestions,
	makeCacheKey: (s: string, t: string) => `${s}:${t}`,
}));

const mockLoadFromAppwrite = mock(() => []);
const mockSyncToAppwrite = mock(() => {});

mock.module("@/lib/question-engine/persistence", () => ({
	loadQuestionsFromAppwrite: mockLoadFromAppwrite,
	syncQuestionsToAppwrite: mockSyncToAppwrite,
}));

mock.module("@/lib/db/client", () => ({
	COLLECTIONS: {
		TOPICS: "topics",
		USER_PROGRESS: "user_progress",
		STUDY_SESSIONS: "study_sessions",
		COMPETENCIES: "competencies",
		QUESTIONS: "questions",
	},
	listDocuments: mock(() => []),
	createDocument: mock(() => "doc-id"),
	updateDocument: mock(() => {}),
}));

mock.module("appwrite", () => ({
	Query: { equal: () => "equal", limit: () => "limit" },
}));

const mockGenerateDiagram = mock(() => ({
	type: "geometry",
	label: "Generated Diagram",
	svgContent: "<svg></svg>",
}));
const mockSearchImage = mock(() => null);

mock.module("@/lib/visual-engine/stem-renderer", () => ({
	generateDiagram: mockGenerateDiagram,
}));

mock.module("@/lib/visual-engine/image-resolver", () => ({
	searchImage: mockSearchImage,
}));

const mockLoadVisualAppwrite = mock(() => null);
const mockSaveVisualAppwrite = mock(() => {});

mock.module("@/lib/visual-engine/visual-persistence", () => ({
	loadVisualFromAppwrite: mockLoadVisualAppwrite,
	saveVisualToAppwrite: mockSaveVisualAppwrite,
}));

const mockGetCachedVisual = mock(() => null);
const mockCacheVisual = mock(() => {});

mock.module("@/lib/db/repositories/visual-cache", () => ({
	getCachedVisual: mockGetCachedVisual,
	cacheVisual: mockCacheVisual,
	makeCacheKey: (qid: string, subj: string) => `${subj}:${qid}`,
}));

const mockVisualResolve = mock(() => ({
	type: "geometry",
	label: "Test Visual",
	imageUrl: "http://example.com/diagram.svg",
}));

mock.module("@/lib/visual-engine/visual-engine", () => ({
	VisualEngine: class {
		resolve = mockVisualResolve;
	},
	visualEngine: { resolve: mockVisualResolve },
}));

const mockAnalyticsSync = mock(() => {});
mock.module("@/lib/services/analytics-service", () => ({
	analyticsService: { sync: mockAnalyticsSync },
}));

const mockSpacedRepUpdate = mock(() => {});
mock.module("@/lib/services/spaced-rep-service", () => ({
	spacedRepService: { update: mockSpacedRepUpdate },
}));

const mockProgressUpdate = mock(() => {});
mock.module("@/lib/services/progress-service", () => ({
	progressService: { update: mockProgressUpdate },
}));

const mockCompUpdate = mock(() => {});
mock.module("@/lib/competency-engine", () => ({
	competencyService: { update: mockCompUpdate },
	computeBloomWeight: mock(() => 1.0),
}));

mock.module("@/lib/competency-engine/types", () => ({}));

const mockCurriculumGetSubject = mock(() => ({
	subjectId: "mathematics",
	subjectName: "Mathematics",
	topics: [
		{
			id: "algebra",
			name: "Algebra",
			order: 1,
			prerequisites: [],
			bloomTarget: "remember",
			subtopics: [],
		},
	],
}));
mock.module("@/curriculum", () => ({
	curriculumRegistry: { getSubject: mockCurriculumGetSubject },
}));

// ── Tests ────────────────────────────────────────────────────────────
const { LearningOrchestrator } = await import(
	"../orchestrator/learning-orchestrator"
);
const { enqueue } = await import("../orchestrator/job-queue");
const { JobProcessor } = await import("../orchestrator/job-processor");

describe("Integration: Orchestrator → VisualEngine → Dexie caching", () => {
	beforeEach(() => {
		mockJobsStore._items.length = 0;
		mockQuestionsStore._items.length = 0;
		mockVisualsStore._items.length = 0;
		mockGenerateWithSystem.mockReset();
		mockGetAI.mockClear();
		mockVisualResolve.mockClear();
		mockGetCachedQuestions.mockClear();
		mockCacheQuestions.mockClear();
		mockLoadFromAppwrite.mockClear();
		mockSyncToAppwrite.mockClear();
		mockAnalyticsSync.mockClear();
		mockSpacedRepUpdate.mockClear();
		mockProgressUpdate.mockClear();
		mockCompUpdate.mockClear();
		mockGenerateDiagram.mockClear();
		mockSearchImage.mockClear();
		mockGetCachedVisual.mockClear();
		mockCacheVisual.mockClear();
		mockGenerateWithSystem.mockImplementation(() => sampleAiResponse);
		mockGetAI.mockImplementation(() => ({
			generateWithSystem: mockGenerateWithSystem,
		}));
	});

	test("1. LearningOrchestrator.initialize() resolves with valid instance", async () => {
		const orchestrator = await LearningOrchestrator.initialize();

		expect(orchestrator).toBeDefined();
		expect(orchestrator).toBeInstanceOf(LearningOrchestrator);
		expect(orchestrator.generateQuestionSet).toBeInstanceOf(Function);
		expect(orchestrator.gradeAndTrack).toBeInstanceOf(Function);
	});

	test("2. generateQuestionSet with valid params returns questions and job IDs", async () => {
		const orchestrator = await LearningOrchestrator.initialize();
		const result = await orchestrator.generateQuestionSet({
			subject: "mathematics",
			topic: "algebra",
			count: 2,
			questionType: "multiple-choice",
		});

		expect(result.questions).toHaveLength(1);
		expect(result.count).toBe(1);
		expect(result.type).toBe("multiple-choice");
		expect(result.jobIds.length).toBeGreaterThanOrEqual(1);
		expect(result.questions[0].questionText).toBe("What is 2 + 2?");

		const jobsInDb = await mockJobsStore.toArray();
		expect(jobsInDb.length).toBeGreaterThanOrEqual(1);
	});

	test("3. gradeAndTrack grades and enqueues analytics and sync jobs", async () => {
		const orchestrator = await LearningOrchestrator.initialize();

		const answer = { type: "option-ids" as const, value: ["B"] };
		const result = await orchestrator.gradeAndTrack(cannedQuestion, answer);

		expect(result.result).toBeDefined();
		expect(result.result.correct).toBe(true);
		expect(result.result.score).toBe(1);
		expect(result.jobIds.length).toBe(4);

		const jobs = await mockJobsStore.toArray();
		expect(jobs.length).toBeGreaterThanOrEqual(4);

		const analyticsJob = jobs.find(
			(j) => (j as { type: string }).type === "analytics-sync",
		);
		const spacedRepJob = jobs.find(
			(j) => (j as { type: string }).type === "spaced-rep-update",
		);
		const progressJob = jobs.find(
			(j) => (j as { type: string }).type === "progress-update",
		);
		const competencyJob = jobs.find(
			(j) => (j as { type: string }).type === "competency-update",
		);

		expect(analyticsJob).toBeDefined();
		expect(spacedRepJob).toBeDefined();
		expect(progressJob).toBeDefined();
		expect(competencyJob).toBeDefined();
	});

	test("4. Visual engine resolves a visual for a STEM question", async () => {
		const { visualEngine } = await import("@/lib/visual-engine/visual-engine");

		const visual = await visualEngine.resolve({
			questionId: cannedQuestion.id,
			questionText: cannedQuestion.questionText,
			subject: "mathematics",
			topic: "algebra",
		});

		expect(visual).toBeDefined();
		expect(visual?.type).toBe("geometry");
		expect(mockVisualResolve).toHaveBeenCalled();
	});

	test("5. Job processor processes batch of queued jobs", async () => {
		const processor = new JobProcessor();

		const _syncId = await enqueue("appwrite-sync", {
			questions: [cannedQuestion],
			subject: "mathematics",
			topic: "algebra",
		});
		const _visId = await enqueue("visual-generation", {
			questionId: cannedQuestion.id,
			questionText: cannedQuestion.questionText,
			subject: "mathematics",
			topic: "algebra",
		});

		const result = await processor.processBatch(5);

		expect(result.processed).toBe(2);
		expect(result.succeeded).toBe(2);
		expect(result.failed).toBe(0);
		expect(mockSyncToAppwrite).toHaveBeenCalled();

		const completedJobs = (await mockJobsStore.toArray()).filter(
			(j) => (j as { status: string }).status === "completed",
		);
		expect(completedJobs).toHaveLength(2);
	});
});
