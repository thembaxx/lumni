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
			paperCode: { type: "string", size: 50 },
			paperNumber: { type: "integer" },
			examPeriod: { type: "string", size: 50 },
			year: { type: "integer" },
			grade: { type: "integer" },
			language: { type: "string", size: 50 },
			totalMarks: { type: "integer" },
			duration: { type: "string", size: 20 },
			fileKeys: { type: "string", size: 1000 },
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
			userId: { type: "string", size: 100, required: true },
			planData: { type: "string", size: 100000 },
			examDates: { type: "string", size: 50000 },
			generatedAt: { type: "datetime" },
			updatedAt: { type: "datetime" },
		},
		indexes: [
			{ key: "idx_study_plans_userId", type: "key", attributes: ["userId"] },
		],
	},
	question_flags: {
		attributes: {
			questionId: { type: "string", size: 100, required: true },
			userId: { type: "string", size: 100, required: true },
			reason: { type: "string", size: 50, required: true },
			details: { type: "string", size: 2000 },
			status: { type: "string", size: 20, required: true },
			createdAt: { type: "datetime" },
		},
		indexes: [
			{ key: "idx_flags_questionId", type: "key", attributes: ["questionId"] },
			{ key: "idx_flags_userId", type: "key", attributes: ["userId"] },
			{ key: "idx_flags_status", type: "key", attributes: ["status"] },
		],
	},
	exam_dates: {
		attributes: {
			cacheKey: { type: "string", size: 255, required: true },
			session: { type: "string", size: 20, required: true },
			year: { type: "integer", required: true },
			slots: { type: "string", size: 100000 },
			updatedAt: { type: "datetime" },
			source: { type: "string", size: 20 },
		},
		indexes: [
			{
				key: "idx_exam_dates_cacheKey",
				type: "unique",
				attributes: ["cacheKey"],
			},
			{ key: "idx_exam_dates_session", type: "key", attributes: ["session"] },
			{ key: "idx_exam_dates_year", type: "key", attributes: ["year"] },
		],
	},
	analytics: {
		attributes: {
			eventType: { type: "string", size: 50 },
			userId: { type: "string", size: 100 },
			subjectId: { type: "string", size: 100 },
			metadata: { type: "string", size: 5000 },
			timestamp: { type: "datetime" },
		},
		indexes: [
			{ key: "idx_analytics_userId", type: "key", attributes: ["userId"] },
			{
				key: "idx_analytics_timestamp",
				type: "key",
				attributes: ["timestamp"],
			},
		],
	},
	teacher_students: {
		attributes: {
			teacherId: { type: "string", size: 100, required: true },
			studentId: { type: "string", size: 100, required: true },
			subjectId: { type: "string", size: 100 },
			createdAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_teacher_students_teacherId",
				type: "key",
				attributes: ["teacherId"],
			},
			{
				key: "idx_teacher_students_studentId",
				type: "key",
				attributes: ["studentId"],
			},
			{
				key: "idx_teacher_students_pair",
				type: "unique",
				attributes: ["teacherId", "studentId"],
			},
		],
	},
	teacher_assignments: {
		attributes: {
			teacherId: { type: "string", size: 100, required: true },
			topicIds: { type: "string", size: 2000, required: true },
			status: { type: "string", size: 20, required: true },
			createdAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_teacher_assignments_teacherId",
				type: "key",
				attributes: ["teacherId"],
			},
		],
	},
	parent_students: {
		attributes: {
			parentId: { type: "string", size: 100, required: true },
			studentId: { type: "string", size: 100, required: true },
			consentStatus: {
				type: "string",
				size: 20,
				required: true,
			},
			canViewProgress: { type: "boolean" },
			canViewScores: { type: "boolean" },
			createdAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_parent_students_parentId",
				type: "key",
				attributes: ["parentId"],
			},
			{
				key: "idx_parent_students_studentId",
				type: "key",
				attributes: ["studentId"],
			},
			{
				key: "idx_parent_students_pair",
				type: "unique",
				attributes: ["parentId", "studentId"],
			},
		],
	},
	study_groups: {
		attributes: {
			name: { type: "string", size: 255, required: true },
			description: { type: "string", size: 2000 },
			subjectId: { type: "string", size: 100 },
			inviteCode: { type: "string", size: 20, required: true },
			createdBy: { type: "string", size: 100, required: true },
			memberCount: { type: "integer" },
			createdAt: { type: "datetime" },
		},
		indexes: [
			{
				key: "idx_groups_inviteCode",
				type: "unique",
				attributes: ["inviteCode"],
			},
			{ key: "idx_groups_createdBy", type: "key", attributes: ["createdBy"] },
		],
	},
	group_members: {
		attributes: {
			groupId: { type: "string", size: 100, required: true },
			userId: { type: "string", size: 100, required: true },
			role: { type: "string", size: 20, required: true },
			joinedAt: { type: "datetime" },
		},
		indexes: [
			{ key: "idx_members_groupId", type: "key", attributes: ["groupId"] },
			{ key: "idx_members_userId", type: "key", attributes: ["userId"] },
			{
				key: "idx_members_pair",
				type: "unique",
				attributes: ["groupId", "userId"],
			},
		],
	},
	group_invites: {
		attributes: {
			groupId: { type: "string", size: 100, required: true },
			code: { type: "string", size: 20, required: true },
			createdBy: { type: "string", size: 100, required: true },
			status: { type: "string", size: 20, required: true },
			expiresAt: { type: "datetime" },
			createdAt: { type: "datetime" },
		},
		indexes: [
			{ key: "idx_invites_groupId", type: "key", attributes: ["groupId"] },
			{ key: "idx_invites_code", type: "key", attributes: ["code"] },
		],
	},
	wrong_answers: {
		attributes: {
			userId: { type: "string", size: 100, required: true },
			questionId: { type: "string", size: 255, required: true },
			questionText: { type: "string", size: 65535, required: true },
			subject: { type: "string", size: 128, required: true },
			topic: { type: "string", size: 128 },
			correctAnswer: { type: "string", size: 65535, required: true },
			userAnswer: { type: "string", size: 65535, required: true },
			explanation: { type: "string", size: 65535 },
			errorType: { type: "string", size: 64 },
			reviewed: { type: "boolean", required: true },
			createdAt: { type: "datetime", required: true },
		},
		indexes: [
			{ key: "idx_wrong_answers_userId", type: "key", attributes: ["userId"] },
			{
				key: "idx_wrong_answers_subject",
				type: "key",
				attributes: ["subject"],
			},
		],
	},
	bookmarks: {
		attributes: {
			userId: { type: "string", size: 100, required: true },
			questionId: { type: "string", size: 255, required: true },
			questionText: { type: "string", size: 65535, required: true },
			subject: { type: "string", size: 128, required: true },
			topic: { type: "string", size: 128 },
			note: { type: "string", size: 65535 },
			savedAt: { type: "datetime", required: true },
		},
		indexes: [
			{ key: "idx_bookmarks_userId", type: "key", attributes: ["userId"] },
			{
				key: "idx_bookmarks_questionId",
				type: "key",
				attributes: ["questionId"],
			},
		],
	},
	notes: {
		attributes: {
			userId: { type: "string", size: 100 },
			content: { type: "string", size: 65535, required: true },
			subject: { type: "string", size: 128 },
			topic: { type: "string", size: 128 },
			createdAt: { type: "datetime", required: true },
			updatedAt: { type: "datetime", required: true },
		},
		indexes: [
			{ key: "idx_notes_userId", type: "key", attributes: ["userId"] },
			{ key: "idx_notes_subject", type: "key", attributes: ["subject"] },
		],
	},
	group_posts: {
		attributes: {
			groupId: { type: "string", size: 100, required: true },
			userId: { type: "string", size: 100, required: true },
			userName: { type: "string", size: 255 },
			content: { type: "string", size: 65535, required: true },
			questionText: { type: "string", size: 65535 },
			subject: { type: "string", size: 128 },
			topic: { type: "string", size: 128 },
			createdAt: { type: "datetime", required: true },
		},
		indexes: [
			{ key: "idx_posts_groupId", type: "key", attributes: ["groupId"] },
			{ key: "idx_posts_userId", type: "key", attributes: ["userId"] },
			{ key: "idx_posts_createdAt", type: "key", attributes: ["createdAt"] },
		],
	},
	group_comments: {
		attributes: {
			postId: { type: "string", size: 100, required: true },
			userId: { type: "string", size: 100, required: true },
			userName: { type: "string", size: 255 },
			content: { type: "string", size: 65535, required: true },
			parentId: { type: "string", size: 100 },
			createdAt: { type: "datetime", required: true },
			updatedAt: { type: "datetime" },
		},
		indexes: [
			{ key: "idx_comments_postId", type: "key", attributes: ["postId"] },
			{ key: "idx_comments_userId", type: "key", attributes: ["userId"] },
		],
	},
	group_reactions: {
		attributes: {
			postId: { type: "string", size: 100 },
			commentId: { type: "string", size: 100 },
			userId: { type: "string", size: 100, required: true },
			emoji: { type: "string", size: 50, required: true },
			createdAt: { type: "datetime", required: true },
		},
		indexes: [
			{ key: "idx_reactions_postId", type: "key", attributes: ["postId"] },
			{
				key: "idx_reactions_commentId",
				type: "key",
				attributes: ["commentId"],
			},
			{ key: "idx_reactions_userId", type: "key", attributes: ["userId"] },
		],
	},
	user_consents: {
		attributes: {
			userId: { type: "string", size: 100, required: true },
			analytics: { type: "boolean", required: true },
			marketing: { type: "boolean", required: true },
			dataSharing: { type: "boolean", required: true },
			tosVersion: { type: "string", size: 20 },
			tosAcceptedAt: { type: "datetime" },
			privacyVersion: { type: "string", size: 20 },
			privacyAcknowledgedAt: { type: "datetime" },
			updatedAt: { type: "datetime", required: true },
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
};
