"use server";

import { eq, inArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { getDb } from "@/lib/db/client";
import {
	question,
	studySession,
	subject as subjectTable,
	topic,
	userProgress,
} from "@/lib/db/schema";

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

function formatSubjectName(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function generateFileName(subject: string, number: number = 1): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

export async function fetchRemoteQAFile(
	subject: string,
	fileNumber: number = 1,
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
	const db = getDb();

	const existing = await db
		.select()
		.from(topic)
		.where(eq(topic.name, topicName))
		.limit(1);

	if (existing.length > 0) {
		return existing[0].id;
	}

	const topicId = `${subjectId}-${formatSubjectName(topicName)}`;
	await db.insert(topic).values({
		id: topicId,
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
	const db = getDb();

	const subjectArr = await db
		.select()
		.from(subjectTable)
		.where(eq(subjectTable.id, subjectId))
		.limit(1);

	const version = subjectArr[0]?.sourceVersion || null;

	const topicList = await db
		.select({ id: topic.id, name: topic.name })
		.from(topic)
		.where(eq(topic.subjectId, subjectId));

	const topicIds = topicList.map((t) => t.id);

	if (topicIds.length === 0) {
		return { topics: [], questions: [], version };
	}

	const questionList = await db
		.select({ id: question.id, topicId: question.topicId })
		.from(question)
		.where(inArray(question.topicId, topicIds));

	return {
		topics: topicList,
		questions: questionList.map((q) => ({
			questionId: q.id,
			topicId: q.topicId,
			version,
		})),
		version,
	};
}

export async function parseQuestions(
	qa: QAQuestion[],
	topicMap: Map<string, string>,
): Promise<{
	questions: {
		id: string;
		topicId: string;
		questionText: string;
		options: string;
		correctAnswer: string;
		explanation: string;
		difficulty: string;
		hasImage: boolean;
		imageData?: string;
	}[];
}> {
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
	newQuestions: {
		id: string;
		topicId: string;
		questionText: string;
		options: string;
		correctAnswer: string;
		explanation: string;
		difficulty: string;
		hasImage: boolean;
		imageData?: string;
	}[],
): Promise<{
	toInsert: typeof newQuestions;
}> {
	const existingIds = new Set(existingQuestions.map((q) => q.id));

	const toInsert = newQuestions.filter((q) => !existingIds.has(q.id));

	return { toInsert };
}

export async function syncSubjectQuestions(
	subject: string,
	fileNumber: number = 1,
): Promise<{
	success: boolean;
	synced: number;
	local: number;
	version: string;
	isFresh: boolean;
	error?: string;
}> {
	try {
		const subjectId = formatSubjectName(subject);

		const subjectRec = await getDb()
			.select()
			.from(subjectTable)
			.where(eq(subjectTable.id, subjectId))
			.limit(1);

		if (subjectRec.length === 0) {
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
		const topicMap = await ensureTopicsExist(uniqueTopics, subjectId);

		const { questions: parsedQuestions } = await parseQuestions(
			remoteData.questions,
			topicMap,
		);

		const { toInsert } = await mergeQuestions(
			localData.questions.map((q) => ({ id: q.questionId })),
			parsedQuestions,
		);

		const db = getDb();
		for (const q of toInsert) {
			await db.insert(question).values({
				id: q.id,
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

		await db
			.update(subjectTable)
			.set({
				sourceUrl: url,
				sourceVersion: remoteVersion,
			})
			.where(eq(subjectTable.id, subjectId));

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
	fileNumber: number = 1,
): Promise<{
	success: boolean;
	synced: number;
	local: number;
	version: string;
	isFresh: boolean;
	error?: string;
}> {
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
