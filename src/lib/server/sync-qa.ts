"use server";

import { Query } from "appwrite";
import { UTApi } from "uploadthing/server";
import {
	COLLECTIONS,
	createDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";

export interface QAFileMetadata {
	subject: string;
	totalQuestions: number;
	version: string;
	curriculum: string;
	createdAt: string;
}

export interface QAOption {
	id: string;
	text: string;
	isCorrect: boolean;
}

export interface QAQuestion {
	id: string;
	topic: string;
	difficulty: string;
	points: number;
	questionText: string;
	questionType: string;
	options: QAOption[];
	supportsDiagram: boolean;
	diagram?: unknown;
	hint?: string;
	explanation: string;
}

export interface QAFile {
	metadata: QAFileMetadata;
	questions: QAQuestion[];
}

export interface ParsedQuestion {
	id: string;
	topicId: string;
	questionText: string;
	options: string;
	correctAnswer: string;
	explanation: string;
	difficulty: string;
	hasImage: boolean;
	imageData?: string;
}

export interface SyncResult {
	success: boolean;
	synced: number;
	local: number;
	version: string;
	isFresh: boolean;
	error?: string;
}

function formatSubjectName(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function generateFileName(subject: string, number = 1): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

export async function fetchRemoteQAFile(
	subject: string,
	fileNumber = 1,
): Promise<{ data: QAFile | null; url: string; error?: string }> {
	try {
		const fileName = generateFileName(subject, fileNumber);
		const utapi = new UTApi();

		const files = await utapi.listFiles();
		const filesList =
			typeof files === "object" && "files" in files
				? (files as unknown as { files: { name: string; url: string }[] }).files
				: [];
		const targetFile = filesList.find(
			(f) =>
				f.name === fileName || f.name === `${subject}_qa_${fileNumber}.json`,
		);

		if (!targetFile) {
			return { data: null, url: "", error: "File not found in UploadThing" };
		}

		const fileUrl = (targetFile as { url: string }).url;
		const response = await fetch(fileUrl);
		if (!response.ok) {
			return {
				data: null,
				url: "",
				error: `Failed to fetch: ${response.status}`,
			};
		}

		const json = (await response.json()) as QAFile;
		return { data: json, url: fileUrl };
	} catch (error) {
		return {
			data: null,
			url: "",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function ensureTopicExists(
	topicName: string,
	subjectId: string,
): Promise<string> {
	const topics = await listDocuments(COLLECTIONS.TOPICS, [
		Query.equal("name", topicName),
		Query.equal("subjectId", subjectId),
		Query.limit(1),
	]);

	if (topics.length > 0) {
		return topics[0].$id;
	}

	const topicId = `${subjectId}-${formatSubjectName(topicName)}`;
	await createDocument(COLLECTIONS.TOPICS, {
		subjectId,
		name: topicName,
		orderIndex: 0,
	});

	return topicId;
}

export async function ensureTopicsExist(
	topics: string[],
	subjectId: string,
): Promise<Map<string, string>> {
	const topicMap = new Map<string, string>();

	for (const topicName of topics) {
		const topicId = await ensureTopicExists(topicName, subjectId);
		topicMap.set(topicName, topicId);
	}

	return topicMap;
}

export async function getLocalQuestions(subjectId: string): Promise<{
	topics: { id: string; name: string }[];
	questions: { questionId: string; topicId: string; version: string | null }[];
	version: string | null;
}> {
	const subjects = await listDocuments(COLLECTIONS.SUBJECTS, [
		Query.equal("code", subjectId),
		Query.limit(1),
	]);

	const version =
		subjects.length > 0
			? ((subjects[0] as Record<string, unknown>).sourceVersion as string) ||
				null
			: null;

	const topicList = await listDocuments(COLLECTIONS.TOPICS, [
		Query.equal("subjectId", subjects[0]?.$id || subjectId),
	]);

	const topicIds = topicList.map((t) => t.$id);

	if (topicIds.length === 0) {
		return { topics: [], questions: [], version };
	}

	const questionList = await listDocuments(COLLECTIONS.QUESTIONS);

	const filteredQuestions = questionList.filter((q) =>
		topicIds.includes(q.topicId as string),
	);

	return {
		topics: topicList.map((t) => ({
			id: t.$id,
			name: t.name as string,
		})),
		questions: filteredQuestions.map((q) => ({
			questionId: q.$id,
			topicId: q.topicId as string,
			version,
		})),
		version,
	};
}

export async function parseQuestions(
	qa: QAQuestion[],
	topicMap: Map<string, string>,
): Promise<{ questions: ParsedQuestion[] }> {
	const parsed = qa.map((q) => {
		const topicId = topicMap.get(q.topic) || "";

		const correctOption = q.options.find((o) => o.isCorrect);
		const correctAnswer = correctOption?.id || "";

		const optionsObj: Record<string, string> = {};
		q.options.forEach((opt) => {
			optionsObj[opt.id] = opt.text;
		});

		const imageData = q.diagram ? JSON.stringify(q.diagram) : undefined;

		return {
			id: q.id,
			topicId,
			questionText: q.questionText,
			options: JSON.stringify(optionsObj),
			correctAnswer,
			explanation: q.explanation || q.hint || "",
			difficulty: q.difficulty.toLowerCase(),
			hasImage: q.supportsDiagram,
			...(imageData && { imageData }),
		};
	});

	return { questions: parsed };
}

export async function mergeQuestions(
	existingQuestions: { id: string }[],
	newQuestions: ParsedQuestion[],
): Promise<{ toInsert: ParsedQuestion[] }> {
	const existingIds = new Set(existingQuestions.map((q) => q.id));
	const toInsert = newQuestions.filter((q) => !existingIds.has(q.id));
	return { toInsert };
}

export async function syncSubjectQuestions(
	subject: string,
	fileNumber = 1,
): Promise<SyncResult> {
	try {
		const subjectId = formatSubjectName(subject);

		const subjects = await listDocuments(COLLECTIONS.SUBJECTS, [
			Query.equal("code", subjectId),
			Query.limit(1),
		]);

		if (subjects.length === 0) {
			return {
				success: false,
				synced: 0,
				local: 0,
				version: "",
				isFresh: false,
				error: "Subject not found",
			};
		}

		const localData = await getLocalQuestions(subjectId);
		const { data: remoteData, url } = await fetchRemoteQAFile(
			subject,
			fileNumber,
		);

		if (!remoteData) {
			return {
				success: false,
				synced: 0,
				local: localData.questions.length,
				version: localData.version || "",
				isFresh: false,
				error: "Subject not found",
			};
		}

		const remoteVersion = remoteData.metadata.version;

		if (localData.version === remoteVersion && localData.questions.length > 0) {
			return {
				success: true,
				synced: 0,
				local: localData.questions.length,
				version: remoteVersion,
				isFresh: true,
			};
		}

		const uniqueTopics = [...new Set(remoteData.questions.map((q) => q.topic))];
		const topicMap = await ensureTopicsExist(uniqueTopics, subjects[0].$id);

		const { questions: parsedQuestions } = await parseQuestions(
			remoteData.questions,
			topicMap,
		);

		const { toInsert } = await mergeQuestions(
			localData.questions.map((q) => ({ id: q.questionId })),
			parsedQuestions,
		);

		for (const q of toInsert) {
			await createDocument(COLLECTIONS.QUESTIONS, {
				topicId: q.topicId,
				type: "multiple_choice",
				questionText: q.questionText,
				options: q.options,
				correctAnswer: q.correctAnswer,
				explanation: q.explanation,
				difficulty: q.difficulty,
				hasImage: q.hasImage,
				imageData: q.imageData,
			});
		}

		await updateDocument(COLLECTIONS.SUBJECTS, subjects[0].$id, {
			sourceUrl: url,
			sourceVersion: remoteVersion,
		});

		return {
			success: true,
			synced: toInsert.length,
			local: localData.questions.length + toInsert.length,
			version: remoteVersion,
			isFresh: false,
		};
	} catch (error) {
		return {
			success: false,
			synced: 0,
			local: 0,
			version: "",
			isFresh: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function autoSyncSubject(
	subject: string,
	fileNumber = 1,
): Promise<SyncResult> {
	const subjectId = formatSubjectName(subject);

	const localData = await getLocalQuestions(subjectId);

	if (localData.version && localData.questions.length > 0) {
		const { data: remoteData } = await fetchRemoteQAFile(subject, fileNumber);

		if (remoteData) {
			const remoteVersion = remoteData.metadata.version;

			if (localData.version === remoteVersion) {
				return {
					success: true,
					synced: 0,
					local: localData.questions.length,
					version: localData.version,
					isFresh: true,
				};
			}
		}
	}

	return syncSubjectQuestions(subject, fileNumber);
}
