import type { CurriculumTopic, SubjectCurriculum } from "./types";

const curricula = new Map<string, SubjectCurriculum>();
let loaded = false;

const CURRICULUM_IMPORTS: Record<string, () => Promise<SubjectCurriculum>> = {
	accounting: () =>
		import("./accounting.json").then((m) => m.default as SubjectCurriculum),
	"afrikaans-first-additional-language": () =>
		import("./afrikaans-first-additional-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"afrikaans-home-language": () =>
		import("./afrikaans-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"agricultural-management-practices": () =>
		import("./agricultural-management-practices.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"agricultural-sciences": () =>
		import("./agricultural-sciences.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"agricultural-technology": () =>
		import("./agricultural-technology.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"business-studies": () =>
		import("./business-studies.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"civil-technology": () =>
		import("./civil-technology.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"computer-applications-technology": () =>
		import("./computer-applications-technology.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"consumer-studies": () =>
		import("./consumer-studies.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"dance-studies": () =>
		import("./dance-studies.json").then((m) => m.default as SubjectCurriculum),
	design: () =>
		import("./design.json").then((m) => m.default as SubjectCurriculum),
	"dramatic-arts": () =>
		import("./dramatic-arts.json").then((m) => m.default as SubjectCurriculum),
	economics: () =>
		import("./economics.json").then((m) => m.default as SubjectCurriculum),
	"electrical-technology": () =>
		import("./electrical-technology.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"engineering-graphics-and-design": () =>
		import("./engineering-graphics-and-design.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"english-first-additional-language": () =>
		import("./english-first-additional-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"english-home-language": () =>
		import("./english-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	geography: () =>
		import("./geography.json").then((m) => m.default as SubjectCurriculum),
	history: () =>
		import("./history.json").then((m) => m.default as SubjectCurriculum),
	"hospitality-studies": () =>
		import("./hospitality-studies.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"information-technology": () =>
		import("./information-technology.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"isi-ndebele-home-language": () =>
		import("./isi-ndebele-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"isi-xhosa-first-additional-language": () =>
		import("./isi-xhosa-first-additional-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"isi-xhosa-home-language": () =>
		import("./isi-xhosa-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"isi-zulu-first-additional-language": () =>
		import("./isi-zulu-first-additional-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"isi-zulu-home-language": () =>
		import("./isi-zulu-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"life-orientation": () =>
		import("./life-orientation.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"life-sciences": () =>
		import("./life-sciences.json").then((m) => m.default as SubjectCurriculum),
	"mathematical-literacy": () =>
		import("./mathematical-literacy.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	mathematics: () =>
		import("./mathematics.json").then((m) => m.default as SubjectCurriculum),
	"mechanical-technology": () =>
		import("./mechanical-technology.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	music: () =>
		import("./music.json").then((m) => m.default as SubjectCurriculum),
	"physical-sciences": () =>
		import("./physical-sciences.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"religion-studies": () =>
		import("./religion-studies.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"sepedi-first-additional-language": () =>
		import("./sepedi-first-additional-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"sepedi-home-language": () =>
		import("./sepedi-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"sesotho-first-additional-language": () =>
		import("./sesotho-first-additional-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"sesotho-home-language": () =>
		import("./sesotho-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"setswana-first-additional-language": () =>
		import("./setswana-first-additional-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"setswana-home-language": () =>
		import("./setswana-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"si-swati-home-language": () =>
		import("./si-swati-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"technical-mathematics": () =>
		import("./technical-mathematics.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"technical-sciences": () =>
		import("./technical-sciences.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	tourism: () =>
		import("./tourism.json").then((m) => m.default as SubjectCurriculum),
	"tshivenda-home-language": () =>
		import("./tshivenda-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
	"visual-arts": () =>
		import("./visual-arts.json").then((m) => m.default as SubjectCurriculum),
	"xitsonga-home-language": () =>
		import("./xitsonga-home-language.json").then(
			(m) => m.default as SubjectCurriculum,
		),
};

async function ensureLoaded() {
	if (loaded) return;
	loaded = true;

	const subjects = (
		await Promise.all(
			Object.values(CURRICULUM_IMPORTS).map((loader) => loader()),
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

		const topicMap = new Map<string, CurriculumTopic & { isSub?: boolean }>();
		for (const topic of subject.topics) {
			topicMap.set(topic.id, topic);
			for (const st of topic.subtopics) {
				topicMap.set(st.id, { ...topic, subtopics: [] });
			}
		}
		return topicMap.get(topicId) ?? null;
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

		const topicsMap = new Map<string, (typeof subject.topics)[number]>();
		for (const t of subject.topics) {
			topicsMap.set(t.id, t);
		}

		const topic = topicsMap.get(topicId);
		if (!topic || topic.prerequisites.length === 0) return [];

		const resolveLevel = (ids: string[]): string[][] => {
			const direct = ids.filter((id) => topicsMap.has(id));
			const indirect: string[][] = [];
			for (const id of direct) {
				const t = topicsMap.get(id);
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
