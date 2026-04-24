import { pgTable, index, foreignKey, text, integer, timestamp, unique, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const topic = pgTable("topic", {
	id: text().primaryKey().notNull(),
	subjectId: text("subject_id").notNull(),
	name: text().notNull(),
	description: text(),
	unitNumber: integer("unit_number"),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("topic_subjectId_idx").using("btree", table.subjectId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subject.id],
			name: "topic_subject_id_subject_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const studySession = pgTable("study_session", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	subjectId: text("subject_id").notNull(),
	questionsAnswered: integer("questions_answered").default(0),
	correctCount: integer("correct_count").default(0),
	duration: integer(),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	endedAt: timestamp("ended_at", { mode: 'string' }),
}, (table) => [
	index("study_session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "study_session_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subject.id],
			name: "study_session_subject_id_subject_id_fk"
		}).onDelete("cascade"),
]);

export const subject = pgTable("subject", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	description: text(),
	icon: text(),
	category: text().notNull(),
	color: text(),
	sourceUrl: text("source_url"),
	sourceVersion: text("source_version"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const userProgress = pgTable("user_progress", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	subjectId: text("subject_id").notNull(),
	questionsAttempted: integer("questions_attempted").default(0),
	correctCount: integer("correct_count").default(0),
	currentStreak: integer("current_streak").default(0),
	longestStreak: integer("longest_streak").default(0),
	lastAttemptAt: timestamp("last_attempt_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_progress_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_progress_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subject.id],
			name: "user_progress_subject_id_subject_id_fk"
		}).onDelete("cascade"),
]);

export const question = pgTable("question", {
	id: text().primaryKey().notNull(),
	topicId: text("topic_id").notNull(),
	type: text().default('multiple_choice').notNull(),
	questionText: text("question_text").notNull(),
	options: text(),
	correctAnswer: text("correct_answer").notNull(),
	explanation: text(),
	difficulty: text().default('medium'),
	hasImage: boolean("has_image").default(false),
	imageUrl: text("image_url"),
	imageData: text("image_data"),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("question_topicId_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topic.id],
			name: "question_topic_id_topic_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const userSubject = pgTable("user_subject", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	subjectId: text("subject_id").notNull(),
	selectedAt: timestamp("selected_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_subject_subjectId_idx").using("btree", table.subjectId.asc().nullsLast().op("text_ops")),
	index("user_subject_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_subject_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subject.id],
			name: "user_subject_subject_id_subject_id_fk"
		}).onDelete("cascade"),
	unique("user_subject_userId_subjectId_unique").on(table.userId, table.subjectId),
]);

export const examPaper = pgTable("exam_paper", {
	id: text().primaryKey().notNull(),
	subjectId: text("subject_id").notNull(),
	year: integer().notNull(),
	paperNumber: integer("paper_number").notNull(),
	type: text().notNull(),
	memoId: text("memo_id"),
	fileUrl: text("file_url").notNull(),
	fileKey: text("file_key").notNull(),
	originalFileName: text("original_file_name"),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("exam_paper_subjectid_idx").using("btree", table.subjectId.asc().nullsLast().op("text_ops")),
	index("exam_paper_subjectid_year_papernumber_type_idx").using("btree", table.subjectId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("int4_ops"), table.paperNumber.asc().nullsLast().op("int4_ops"), table.type.asc().nullsLast().op("int4_ops")),
]);
