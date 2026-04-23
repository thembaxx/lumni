"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
	studySession,
	subject as subjectTable,
	userProgress,
} from "@/lib/db/schema";
import { autoSyncSubject, syncSubjectQuestions } from "./sync-qa";

const ALL_SUBJECTS = [
	"physics",
	"mathematics",
	"physical-sciences",
	"life-sciences",
	"accounting",
	"business-studies",
	"economics",
	"geography",
	"history",
];

export async function syncSubject(subject: string): Promise<{
	success: boolean;
	synced: number;
	local: number;
	version: string;
	error?: string;
}> {
	return syncSubjectQuestions(subject, 1);
}

export async function syncAllSubjects(): Promise<{
	results: {
		subject: string;
		success: boolean;
		synced: number;
		local: number;
		version: string;
		error?: string;
	}[];
}> {
	const results = [];

	for (const subject of ALL_SUBJECTS) {
		const result = await syncSubjectQuestions(subject, 1);
		results.push({
			subject,
			...result,
		});
	}

	return { results };
}

export async function checkSubjectStatus(subject: string): Promise<{
	exists: boolean;
	localQuestions: number;
	version: string | null;
	needsSync: boolean;
}> {
	try {
		const subjectId = subject.toLowerCase().replace(/\s+/g, "-");
		const db = getDb();

		const subjectRec = await db
			.select()
			.from(subjectTable)
			.where(eq(subjectTable.id, subjectId))
			.limit(1);

		if (subjectRec.length === 0) {
			return {
				exists: false,
				localQuestions: 0,
				version: null,
				needsSync: true,
			};
		}

		const version = subjectRec[0].sourceVersion || null;
		const needsSync = !version;

		return {
			exists: true,
			localQuestions: 0,
			version,
			needsSync,
		};
	} catch {
		return {
			exists: false,
			localQuestions: 0,
			version: null,
			needsSync: true,
		};
	}
}

export async function refreshSubject(subject: string): Promise<{
	success: boolean;
	synced: number;
	local: number;
	version: string;
	isFresh: boolean;
	error?: string;
}> {
	const result = await autoSyncSubject(subject, 1);

	return {
		success: result.success,
		synced: result.synced,
		local: result.local,
		version: result.version,
		isFresh: result.isFresh ?? false,
		error: result.error,
	};
}
