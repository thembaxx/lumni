export type AttributeType = "string" | "integer" | "boolean" | "datetime";

export type AttributeConfig = {
	type: AttributeType;
	size?: number;
	required?: boolean;
};

export type IndexConfig = {
	key: string;
	type: "key" | "unique" | "fulltext";
	attributes: string[];
};

export type CollectionSchema = {
	attributes: Record<string, AttributeConfig>;
	indexes: IndexConfig[];
};

export const schemaConfig: Record<string, CollectionSchema> = {
	subjects: {
		attributes: {
			name: { type: "string", size: 255, required: true },
			code: { type: "string", size: 100, required: true },
			description: { type: "string", size: 1000 },
			icon: { type: "string", size: 50 },
			category: { type: "string", size: 50 },
			color: { type: "string", size: 50 },
		},
		indexes: [
			{ key: "idx_subjects_code", type: "unique", attributes: ["code"] },
		],
	},
	topics: {
		attributes: {
			subjectId: { type: "string", size: 100, required: true },
			name: { type: "string", size: 255, required: true },
			description: { type: "string", size: 2000 },
			unitNumber: { type: "integer" },
			orderIndex: { type: "integer" },
		},
		indexes: [
			{ key: "idx_topics_subjectId", type: "key", attributes: ["subjectId"] },
			{ key: "idx_topics_name", type: "key", attributes: ["name"] },
		],
	},
	questions: {
		attributes: {
			topicId: { type: "string", size: 100, required: true },
			type: { type: "string", size: 50 },
			questionText: { type: "string", size: 10000 },
			options: { type: "string", size: 50000 },
			correctAnswer: { type: "string", size: 1000 },
			explanation: { type: "string", size: 5000 },
			difficulty: { type: "string", size: 20 },
			hasImage: { type: "boolean" },
			imageUrl: { type: "string", size: 500 },
			orderIndex: { type: "integer" },
		},
		indexes: [
			{ key: "idx_questions_topicId", type: "key", attributes: ["topicId"] },
		],
	},
	user_subjects: {
		attributes: {
			userId: { type: "string", size: 100, required: true },
			subjectId: { type: "string", size: 100, required: true },
			selectedAt: { type: "datetime" },
		},
		indexes: [
			{ key: "idx_user_subjects_userId", type: "key", attributes: ["userId"] },
			{
				key: "idx_user_subjects_user_subject",
				type: "unique",
				attributes: ["userId", "subjectId"],
			},
		],
	},
	user_progress: {
		attributes: {
			userId: { type: "string", size: 100, required: true },
			subjectId: { type: "string", size: 100 },
			questionsAttempted: { type: "integer" },
			correctCount: { type: "integer" },
			currentStreak: { type: "integer" },
			longestStreak: { type: "integer" },
			lastAttemptAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_user_progress_userId",
				type: "key",
				attributes: ["userId"],
			},
		],
	},
	study_sessions: {
		attributes: {
			userId: { type: "string", size: 100, required: true },
			subjectId: { type: "string", size: 100 },
			questionsAnswered: { type: "integer" },
			correctCount: { type: "integer" },
			duration: { type: "integer" },
			startedAt: { type: "datetime" },
			endedAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_study_sessions_userId",
				type: "key",
				attributes: ["userId"],
			},
		],
	},
	exam_papers: {
		attributes: {
			subject: { type: "string", size: 100 },
			subjectCode: { type: "string", size: 20 },
			subjectName: { type: "string", size: 100 },
			paperCode: { type: "string", size: 50 },
			paperNumber: { type: "integer" },
			examPeriod: { type: "string", size: 50 },
			year: { type: "integer" },
			grade: { type: "integer" },
			language: { type: "string", size: 50 },
			totalMarks: { type: "integer" },
			duration: { type: "string", size: 20 },
			type: { type: "string", size: 10 },
			memoId: { type: "string", size: 50 },
			fileKeys: { type: "string", size: 1000 },
			fileUrl: { type: "string", size: 500 },
			originalFileName: { type: "string", size: 200 },
		},
		indexes: [
			{
				key: "idx_exam_papers_subjectId",
				type: "key",
				attributes: ["subject"],
			},
			{ key: "idx_exam_papers_year", type: "key", attributes: ["year"] },
			{
				key: "idx_exam_papers_lookup",
				type: "key",
				attributes: ["subject", "year", "paperNumber"],
			},
		],
	},
	visuals: {
		attributes: {
			questionId: { type: "string", size: 100 },
			cacheKey: { type: "string", size: 255 },
			subject: { type: "string", size: 50 },
			visualType: { type: "string", size: 50 },
			data: { type: "string", size: 100000 },
			createdAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_visuals_questionId",
				type: "key",
				attributes: ["questionId"],
			},
			{ key: "idx_visuals_cacheKey", type: "key", attributes: ["cacheKey"] },
		],
	},
	competencies: {
		attributes: {
			userId: { type: "string", size: 100, required: true },
			subjectId: { type: "string", size: 100 },
			topicId: { type: "string", size: 100 },
			bloomLevel: { type: "string", size: 50 },
			proficiency: { type: "integer" },
			lastPracticedAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_competencies_userId",
				type: "key",
				attributes: ["userId"],
			},
			{
				key: "idx_competencies_lookup",
				type: "key",
				attributes: ["subjectId", "topicId", "bloomLevel"],
			},
		],
	},
	exam_sessions: {
		attributes: {
			examPaperId: { type: "string", size: 100, required: true },
			answers: { type: "string", size: 50000 },
			flags: { type: "string", size: 5000 },
			timeRemaining: { type: "integer" },
			completed: { type: "boolean" },
			startedAt: { type: "datetime" },
			lastSavedAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_exam_sessions_paper",
				type: "key",
				attributes: ["examPaperId"],
			},
		],
	},
	referral_codes: {
		attributes: {
			userId: { type: "string", size: 100, required: true },
			code: { type: "string", size: 100, required: true },
			createdAt: { type: "datetime" },
		},
		indexes: [
			{ key: "idx_referral_codes_userId", type: "key", attributes: ["userId"] },
			{ key: "idx_referral_codes_code", type: "unique", attributes: ["code"] },
		],
	},
	referrals: {
		attributes: {
			referrerId: { type: "string", size: 100, required: true },
			refereeId: { type: "string", size: 100, required: true },
			code: { type: "string", size: 100, required: true },
			status: { type: "string", size: 20, required: true },
			rewardedAt: { type: "datetime" },
			createdAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_referrals_referrerId",
				type: "key",
				attributes: ["referrerId"],
			},
			{
				key: "idx_referrals_refereeId",
				type: "key",
				attributes: ["refereeId"],
			},
			{ key: "idx_referrals_status", type: "key", attributes: ["status"] },
		],
	},
	study_plans: {
		attributes: {
			createdAt: { type: "datetime", required: true },
		},
		indexes: [
			{
				key: "idx_user_consents_userId",
				type: "unique",
				attributes: ["userId"],
			},
		],
	},
	shared_questions: {
		attributes: {
			id: { type: "string", size: 100, required: true },
			question: { type: "string", size: 100000, required: true },
			subject: { type: "string", size: 100, required: true },
			topic: { type: "string", size: 100, required: true },
			sharedById: { type: "string", size: 100, required: true },
			sharedAt: { type: "datetime", required: true },
			viewCount: { type: "integer" },
		},
		indexes: [
			{
				key: "idx_shared_questions_id",
				type: "unique",
				attributes: ["id"],
			},
			{
				key: "idx_shared_questions_subject",
				type: "key",
				attributes: ["subject"],
			},
		],
	},
	teacher_observations: {
		attributes: {
			studentId: { type: "string", size: 100, required: true },
			teacherId: { type: "string", size: 100, required: true },
			content: { type: "string", size: 10000, required: true },
			subject: { type: "string", size: 100 },
			createdAt: { type: "datetime", required: true },
		},
		indexes: [
			{
				key: "idx_teacher_observations_studentId",
				type: "key",
				attributes: ["studentId"],
			},
			{
				key: "idx_teacher_observations_teacherId",
				type: "key",
				attributes: ["teacherId"],
			},
		],
	},
	assignment_messages: {
		attributes: {
			assignmentId: { type: "string", size: 100, required: true },
			senderId: { type: "string", size: 100, required: true },
			senderRole: { type: "string", size: 20, required: true },
			content: { type: "string", size: 10000, required: true },
			createdAt: { type: "datetime", required: true },
		},
		indexes: [
			{
				key: "idx_assignment_messages_assignmentId",
				type: "key",
				attributes: ["assignmentId"],
			},
		],
	},
	ghost_links: {
		attributes: {
			token: { type: "string", size: 255, required: true },
			teacherId: { type: "string", size: 100, required: true },
			expiresAt: { type: "datetime", required: true },
			revoked: { type: "boolean" },
		},
		indexes: [
			{
				key: "idx_ghost_links_token",
				type: "key",
				attributes: ["token"],
			},
		],
	},
	question_flags: {
		attributes: {
			questionId: { type: "string", size: 100, required: true },
			userId: { type: "string", size: 100, required: true },
			reason: { type: "string", size: 255, required: true },
			details: { type: "string", size: 5000 },
			status: { type: "string", size: 20 },
			createdAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_question_flags_questionId",
				type: "key",
				attributes: ["questionId"],
			},
		],
	},
	analytics: {
		attributes: {
			eventType: { type: "string", size: 50, required: true },
			userId: { type: "string", size: 100 },
			sessionId: { type: "string", size: 100 },
			metadata: { type: "string", size: 10000 },
			timestamp: { type: "integer", required: true },
		},
		indexes: [
			{
				key: "idx_analytics_timestamp",
				type: "key",
				attributes: ["timestamp"],
			},
		],
	},
	live_sessions: {
		attributes: {
			groupId: { type: "string", size: 100, required: true },
			startedBy: { type: "string", size: 100, required: true },
			startedByName: { type: "string", size: 100 },
			subject: { type: "string", size: 100 },
			status: { type: "string", size: 20 },
			startedAt: { type: "datetime" },
			endedAt: { type: "datetime" },
			participantCount: { type: "integer" },
		},
		indexes: [
			{
				key: "idx_live_sessions_group",
				type: "key",
				attributes: ["groupId"],
			},
			{
				key: "idx_live_sessions_status",
				type: "key",
				attributes: ["status"],
			},
		],
	},
	live_session_participants: {
		attributes: {
			sessionId: { type: "string", size: 100, required: true },
			userId: { type: "string", size: 100, required: true },
			userName: { type: "string", size: 100 },
			joinedAt: { type: "datetime" },
			status: { type: "string", size: 20 },
			currentActivity: { type: "string", size: 500 },
		},
		indexes: [
			{
				key: "idx_lsp_session",
				type: "key",
				attributes: ["sessionId"],
			},
			{
				key: "idx_lsp_user",
				type: "key",
				attributes: ["userId"],
			},
		],
	},
};
