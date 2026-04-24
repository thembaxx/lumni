import { relations } from "drizzle-orm/relations";
import { subject, topic, user, session, studySession, userProgress, question, account, userSubject } from "./schema";

export const topicRelations = relations(topic, ({one, many}) => ({
	subject: one(subject, {
		fields: [topic.subjectId],
		references: [subject.id]
	}),
	questions: many(question),
}));

export const subjectRelations = relations(subject, ({many}) => ({
	topics: many(topic),
	studySessions: many(studySession),
	userProgresses: many(userProgress),
	userSubjects: many(userSubject),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	studySessions: many(studySession),
	userProgresses: many(userProgress),
	accounts: many(account),
	userSubjects: many(userSubject),
}));

export const studySessionRelations = relations(studySession, ({one}) => ({
	user: one(user, {
		fields: [studySession.userId],
		references: [user.id]
	}),
	subject: one(subject, {
		fields: [studySession.subjectId],
		references: [subject.id]
	}),
}));

export const userProgressRelations = relations(userProgress, ({one}) => ({
	user: one(user, {
		fields: [userProgress.userId],
		references: [user.id]
	}),
	subject: one(subject, {
		fields: [userProgress.subjectId],
		references: [subject.id]
	}),
}));

export const questionRelations = relations(question, ({one}) => ({
	topic: one(topic, {
		fields: [question.topicId],
		references: [topic.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userSubjectRelations = relations(userSubject, ({one}) => ({
	user: one(user, {
		fields: [userSubject.userId],
		references: [user.id]
	}),
	subject: one(subject, {
		fields: [userSubject.subjectId],
		references: [subject.id]
	}),
}));