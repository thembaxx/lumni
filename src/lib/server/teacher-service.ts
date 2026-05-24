import { Query } from "appwrite";
import { Users } from "node-appwrite";
import { serverClient } from "@/lib/appwrite";
import {
	COLLECTIONS,
	createDocument,
	deleteDocument,
	listDocuments,
} from "@/lib/db/client";

export interface TeacherStudent {
	id: string;
	name: string;
	initials: string;
	grade: string;
	overallScore: number;
	weakTopics: string[];
	lastActive: string;
}

export interface TopicMasteryData {
	topic: string;
	mastery: "mastered" | "proficient" | "developing" | "novice";
	studentCount: number;
	avgScore: number;
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function computeMasteryLevel(avgScore: number): TopicMasteryData["mastery"] {
	if (avgScore >= 85) return "mastered";
	if (avgScore >= 65) return "proficient";
	if (avgScore >= 40) return "developing";
	return "novice";
}

function relativeTime(dateStr: string | undefined): string {
	if (!dateStr) return "Never";
	const d = new Date(dateStr);
	const now = Date.now();
	const diff = now - d.getTime();
	const mins = Math.floor(diff / 60000);
	const hrs = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins} min ago`;
	if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
	if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
	return d.toLocaleDateString();
}

export async function getTeacherStudents(
	teacherId: string,
): Promise<TeacherStudent[]> {
	const relationships = await listDocuments(COLLECTIONS.TEACHER_STUDENTS, [
		Query.equal("teacherId", teacherId),
	]);
	if (relationships.length === 0) return [];

	const studentIds = relationships.map(
		(r) => (r as Record<string, unknown>).studentId as string,
	);

	const usersApi = new Users(serverClient);
	const userMap = new Map<string, { name: string; grade: string }>();
	try {
		const userEntries = await Promise.all(
			studentIds.map(async (sid) => {
				try {
					const u = await usersApi.get(sid);
					return [sid, { name: u.name || "Unknown", grade: (u.prefs?.grade as string) || "Matric" }] as const;
				} catch {
					return [sid, { name: "Unknown", grade: "Matric" }] as const;
				}
			}),
		);
		for (const [sid, entry] of userEntries) {
			userMap.set(sid, entry);
		}
	} catch {
		// fallback
	}

	const [allCompetencies, allProgress, allSessions] = await Promise.all([
		Promise.all(
			studentIds.map((sid) =>
				listDocuments(COLLECTIONS.COMPETENCIES, [Query.equal("userId", sid)]),
			),
		),
		Promise.all(
			studentIds.map((sid) =>
				listDocuments(COLLECTIONS.USER_PROGRESS, [
					Query.equal("userId", sid),
					Query.limit(1),
				]),
			),
		),
		Promise.all(
			studentIds.map((sid) =>
				listDocuments(COLLECTIONS.STUDY_SESSIONS, [Query.equal("userId", sid)]),
			),
		),
	]);

	const competencies = allCompetencies.flat();
	const _progressDocs = allProgress.flat();
	const sessions = allSessions.flat();

	const compByUser = new Map<string, Record<string, number[]>>();
	for (const c of competencies) {
		const doc = c as Record<string, unknown>;
		const uid = doc.userId as string;
		const topic = (doc.topicId as string) || "unknown";
		const score = (doc.proficiency as number) || 0;
		if (!compByUser.has(uid)) compByUser.set(uid, {});
		const topics = compByUser.get(uid) as Record<string, number[]>;
		if (!topics[topic]) topics[topic] = [];
		topics[topic].push(score);
	}

	const lastActiveByUser = new Map<string, string>();
	for (const s of sessions) {
		const doc = s as Record<string, unknown>;
		const uid = doc.userId as string;
		const ended = doc.endedAt as string | undefined;
		if (
			ended &&
			(!lastActiveByUser.has(uid) ||
				ended > (lastActiveByUser.get(uid) as string))
		) {
			lastActiveByUser.set(uid, ended);
		}
	}

	const students: TeacherStudent[] = [];
	for (const sid of studentIds) {
		const info = userMap.get(sid);
		const topics = compByUser.get(sid) || {};
		const topicEntries = Object.entries(topics);
		const allScores = topicEntries.flatMap(([, scores]) => scores);
		const overallScore =
			allScores.length > 0
				? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
				: 0;

		const weakTopics: string[] = [];
		for (const [topic, scores] of topicEntries) {
			const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
			if (avg < 65) weakTopics.push(topic);
		}

		students.push({
			id: sid,
			name: info?.name || "Unknown",
			initials: getInitials(info?.name || "U"),
			grade: info?.grade || "Matric",
			overallScore,
			weakTopics: weakTopics.slice(0, 5),
			lastActive: relativeTime(lastActiveByUser.get(sid)),
		});
	}

	return students;
}

export async function getTeacherTopicMastery(
	teacherId: string,
): Promise<TopicMasteryData[]> {
	const relationships = await listDocuments(COLLECTIONS.TEACHER_STUDENTS, [
		Query.equal("teacherId", teacherId),
	]);
	if (relationships.length === 0) return [];

	const studentIds = relationships.map(
		(r) => (r as Record<string, unknown>).studentId as string,
	);

	const allCompetencies = await Promise.all(
		studentIds.map((sid) =>
			listDocuments(COLLECTIONS.COMPETENCIES, [Query.equal("userId", sid)]),
		),
	);

	const topicScores = new Map<string, number[]>();
	for (const comps of allCompetencies) {
		for (const c of comps) {
			const doc = c as Record<string, unknown>;
			const topic = (doc.topicId as string) || "unknown";
			const score = (doc.proficiency as number) || 0;
			if (!topicScores.has(topic)) topicScores.set(topic, []);
			topicScores.get(topic)?.push(score);
		}
	}

	const results: TopicMasteryData[] = [];
	for (const [topic, scores] of topicScores) {
		const avgScore = Math.round(
			scores.reduce((a, b) => a + b, 0) / scores.length,
		);
		results.push({
			topic,
			mastery: computeMasteryLevel(avgScore),
			studentCount: studentIds.length,
			avgScore,
		});
	}

	return results.sort((a, b) => b.avgScore - a.avgScore);
}

export async function linkStudentToTeacher(
	teacherId: string,
	studentId: string,
	subjectId?: string,
): Promise<void> {
	await createDocument(COLLECTIONS.TEACHER_STUDENTS, {
		teacherId,
		studentId,
		subjectId: subjectId || null,
	});
}

export async function unlinkStudentFromTeacher(
	teacherId: string,
	studentId: string,
): Promise<void> {
	const existing = await listDocuments(COLLECTIONS.TEACHER_STUDENTS, [
		Query.equal("teacherId", teacherId),
		Query.equal("studentId", studentId),
		Query.limit(1),
	]);
	if (existing.length > 0) {
		await deleteDocument(
			COLLECTIONS.TEACHER_STUDENTS,
			(existing[0] as Record<string, unknown>).$id as string,
		);
	}
}
