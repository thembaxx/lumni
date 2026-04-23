import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	unique,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const subject = sqliteTable("subject", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	code: text("code").notNull(),
	description: text("description"),
	icon: text("icon"),
	category: text("category").notNull(),
	color: text("color"),
	sourceUrl: text("source_url"),
	sourceVersion: text("source_version"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
});

export const topic = sqliteTable(
	"topic",
	{
		id: text("id").primaryKey(),
		subjectId: text("subject_id")
			.notNull()
			.references(() => subject.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		unitNumber: integer("unit_number"),
		orderIndex: integer("order_index").default(0),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [index("topic_subjectId_idx").on(table.subjectId)],
);

export const question = sqliteTable(
	"question",
	{
		id: text("id").primaryKey(),
		topicId: text("topic_id")
			.notNull()
			.references(() => topic.id, { onDelete: "cascade" }),
		type: text("type").notNull().default("multiple_choice"),
		questionText: text("question_text").notNull(),
		options: text("options"),
		correctAnswer: text("correct_answer").notNull(),
		explanation: text("explanation"),
		difficulty: text("difficulty").default("medium"),
		hasImage: integer("has_image", { mode: "boolean" }).default(false),
		imageUrl: text("image_url"),
		imageData: text("image_data"),
		orderIndex: integer("order_index").default(0),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [index("question_topicId_idx").on(table.topicId)],
);

export const userSubject = sqliteTable(
	"user_subject",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		subjectId: text("subject_id")
			.notNull()
			.references(() => subject.id, { onDelete: "cascade" }),
		selectedAt: integer("selected_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("user_subject_userId_idx").on(table.userId),
		index("user_subject_subjectId_idx").on(table.subjectId),
		unique("user_subject_userId_subjectId_unique").on(
			table.userId,
			table.subjectId,
		),
	],
);

export const userProgress = sqliteTable(
	"user_progress",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		subjectId: text("subject_id")
			.notNull()
			.references(() => subject.id, { onDelete: "cascade" }),
		questionsAttempted: integer("questions_attempted").default(0),
		correctCount: integer("correct_count").default(0),
		currentStreak: integer("current_streak").default(0),
		longestStreak: integer("longest_streak").default(0),
		lastAttemptAt: integer("last_attempt_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("user_progress_userId_idx").on(table.userId)],
);

export const studySession = sqliteTable(
	"study_session",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		subjectId: text("subject_id")
			.notNull()
			.references(() => subject.id, { onDelete: "cascade" }),
		questionsAnswered: integer("questions_answered").default(0),
		correctCount: integer("correct_count").default(0),
		duration: integer("duration"),
		startedAt: integer("started_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		endedAt: integer("ended_at", { mode: "timestamp_ms" }),
	},
	(table) => [index("study_session_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const subjectRelations = relations(subject, ({ many }) => ({
	topics: many(topic),
	userSubjects: many(userSubject),
	userProgresses: many(userProgress),
}));

export const topicRelations = relations(topic, ({ one, many }) => ({
	subject: one(subject, {
		fields: [topic.subjectId],
		references: [subject.id],
	}),
	questions: many(question),
}));

export const questionRelations = relations(question, ({ one }) => ({
	topic: one(topic, {
		fields: [question.topicId],
		references: [topic.id],
	}),
}));

export const userSubjectRelations = relations(userSubject, ({ one }) => ({
	user: one(user, {
		fields: [userSubject.userId],
		references: [user.id],
	}),
	subject: one(subject, {
		fields: [userSubject.subjectId],
		references: [subject.id],
	}),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
	user: one(user, {
		fields: [userProgress.userId],
		references: [user.id],
	}),
	subject: one(subject, {
		fields: [userProgress.subjectId],
		references: [subject.id],
	}),
}));

export const studySessionRelations = relations(studySession, ({ one }) => ({
	user: one(user, {
		fields: [studySession.userId],
		references: [user.id],
	}),
	subject: one(subject, {
		fields: [studySession.subjectId],
		references: [subject.id],
	}),
}));
