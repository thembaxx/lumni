"use server";

import { Query } from "appwrite";
import { COLLECTIONS, listDocuments, updateDocument } from "@/lib/db/client";
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

	for (const s of ALL_SUBJECTS) {
		const result = await syncSubjectQuestions(s, 1);
		results.push({
			subject: s,
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
		const subjects = await listDocuments(COLLECTIONS.SUBJECTS, [
			Query.equal("code", subjectId),
			Query.limit(1),
		]);

		if (subjects.length === 0) {
			return {
				exists: false,
				localQuestions: 0,
				version: null,
				needsSync: true,
			};
		}

		const version =
			((subjects[0] as Record<string, unknown>).sourceVersion as string) ||
			null;
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
