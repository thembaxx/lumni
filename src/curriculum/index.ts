import type { CurriculumTopic, SubjectCurriculum } from "./types";

const CURRICULUM_IDS = [
	"accounting",
	"afrikaans-first-additional-language",
	"afrikaans-home-language",
	"agricultural-management-practices",
	"agricultural-sciences",
	"agricultural-technology",
	"business-studies",
	"civil-technology",
	"computer-applications-technology",
	"consumer-studies",
	"dance-studies",
	"design",
	"dramatic-arts",
	"economics",
	"electrical-technology",
	"engineering-graphics-and-design",
	"english-first-additional-language",
	"english-home-language",
	"geography",
	"history",
	"hospitality-studies",
	"information-technology",
	"isi-ndebele-home-language",
	"isi-xhosa-first-additional-language",
	"isi-xhosa-home-language",
	"isi-zulu-first-additional-language",
	"isi-zulu-home-language",
	"life-orientation",
	"life-sciences",
	"mathematical-literacy",
	"mathematics",
	"mechanical-technology",
	"music",
	"physical-sciences",
	"religion-studies",
	"sepedi-first-additional-language",
	"sepedi-home-language",
	"sesotho-first-additional-language",
	"sesotho-home-language",
	"setswana-first-additional-language",
	"setswana-home-language",
	"si-swati-home-language",
	"technical-mathematics",
	"technical-sciences",
	"tourism",
	"tshivenda-home-language",
	"visual-arts",
	"xitsonga-home-language",
];

const curricula = new Map<string, SubjectCurriculum>();
let loaded = false;

async function ensureLoaded() {
	if (loaded) return;
	loaded = true;

	const subjects = (
		await Promise.all(
			CURRICULUM_IDS.map((id) =>
				import(`./${id}.json`).then((m) => m.default as SubjectCurriculum),
			),
		)
	).filter(Boolean);

	for (const subject of subjects) {
		curricula.set(subject.subjectId, subject);
	}
}

export class CurriculumRegistry {
	async getSubject(subjectId: string): Promise<SubjectCurriculum | null> {
		await ensureLoaded();
		return curricula.get(subjectId) ?? null;
	}

	async getTopic(
		subjectId: string,
		topicId: string,
	): Promise<CurriculumTopic | null> {
		await ensureLoaded();
		const subject = curricula.get(subjectId);
		if (!subject) return null;

		for (const topic of subject.topics) {
			if (topic.id === topicId) return topic;
			const sub = topic.subtopics.find((st) => st.id === topicId);
			if (sub) return { ...topic, subtopics: [] };
		}
		return null;
	}

	async getAvailableTopics(
		subjectId: string,
		masteredTopics: string[],
	): Promise<CurriculumTopic[]> {
		await ensureLoaded();
		const subject = curricula.get(subjectId);
		if (!subject) return [];

		const mastered = new Set(masteredTopics);

		return subject.topics.filter((topic) => {
			if (mastered.has(topic.id)) return false;
			return topic.prerequisites.every((p) => mastered.has(p));
		});
	}

	async getPrerequisiteChain(
		subjectId: string,
		topicId: string,
	): Promise<string[][]> {
		await ensureLoaded();
		const subject = curricula.get(subjectId);
		if (!subject) return [];

		const topic = subject.topics.find((t) => t.id === topicId);
		if (!topic || topic.prerequisites.length === 0) return [];

		const resolveLevel = (ids: string[]): string[][] => {
			const direct = ids.filter((id) =>
				subject.topics.some((t) => t.id === id),
			);
			const indirect: string[][] = [];
			for (const id of direct) {
				const t = subject.topics.find((t) => t.id === id);
				if (t && t.prerequisites.length > 0) {
					indirect.push(...resolveLevel(t.prerequisites));
				}
			}
			return [...indirect, direct];
		};

		return resolveLevel(topic.prerequisites);
	}

	isLoaded(): boolean {
		return loaded;
	}
}

export const curriculumRegistry = new CurriculumRegistry();
