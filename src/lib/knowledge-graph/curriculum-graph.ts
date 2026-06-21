import type { CurriculumTopic, SubjectCurriculum } from "@/curriculum/types";
import type { KnowledgeEdge, KnowledgeGraph, KnowledgeNode } from "./types";

function classifyTopic(
	topic: CurriculumTopic,
	allTopics: Map<string, CurriculumTopic>,
	visited = new Set<string>(),
): "prerequisite" | "core" | "advanced" {
	if (visited.has(topic.id)) return "core";
	visited.add(topic.id);

	const hasPrereqs =
		topic.prerequisites.length > 0 &&
		topic.prerequisites.some((p) => allTopics.has(p));

	const hasDependents = allTopics
		.values()
		.some((t) => t.prerequisites.includes(topic.id));

	if (hasPrereqs && !hasDependents) return "advanced";
	if (!hasPrereqs && hasDependents) return "prerequisite";
	if (hasPrereqs && hasDependents) return "core";

	return "core";
}

function findTopicById(
	allTopics: Map<string, CurriculumTopic>,
	id: string,
): CurriculumTopic | undefined {
	for (const topic of allTopics.values()) {
		if (topic.id === id) return topic;
		for (const st of topic.subtopics) {
			if (st.id === id) return topic;
		}
	}
	return undefined;
}

export function buildGraphFromCurriculum(
	curriculum: SubjectCurriculum,
	focusTopicId?: string,
): KnowledgeGraph {
	const allTopics = new Map<string, CurriculumTopic>();
	for (const t of curriculum.topics) {
		allTopics.set(t.id, t);
	}

	const nodes: KnowledgeNode[] = [];
	const edges: KnowledgeEdge[] = [];
	const nodeIds = new Set<string>();

	if (focusTopicId) {
		const focusTopic = allTopics.get(focusTopicId);
		if (!focusTopic) return { nodes: [], edges: [] };

		const chain = collectPrerequisiteChain(focusTopic, allTopics, new Set());
		const advanced = collectDependents(focusTopic, allTopics, new Set());

		for (const t of chain) {
			if (!nodeIds.has(t.id)) {
				nodeIds.add(t.id);
				const isFocus = t.id === focusTopicId;
				const isAncestor =
					!isFocus && chain.indexOf(t) < chain.indexOf(focusTopic);
				nodes.push({
					id: t.id,
					label: t.name,
					type: isFocus ? "core" : isAncestor ? "prerequisite" : "prerequisite",
				});
			}
		}

		if (!nodeIds.has(focusTopicId)) {
			nodeIds.add(focusTopicId);
			nodes.push({ id: focusTopicId, label: focusTopic.name, type: "core" });
		}

		for (const t of advanced) {
			if (!nodeIds.has(t.id)) {
				nodeIds.add(t.id);
				nodes.push({ id: t.id, label: t.name, type: "advanced" });
			}
		}

		for (const t of [...chain, focusTopic, ...advanced]) {
			for (const prereqId of t.prerequisites) {
				const prereqTopic = findTopicById(allTopics, prereqId);
				if (
					prereqTopic &&
					nodeIds.has(prereqTopic.id) &&
					nodeIds.has(t.id) &&
					prereqTopic.id !== t.id
				) {
					const edgeKey = `${prereqTopic.id}->${t.id}`;
					if (!edges.some((e) => `${e.from}->${e.to}` === edgeKey)) {
						edges.push({
							from: prereqTopic.id,
							to: t.id,
							relation: "leads_to",
						});
					}
				}
			}
		}
	} else {
		for (const topic of curriculum.topics) {
			if (!nodeIds.has(topic.id)) {
				nodeIds.add(topic.id);
				nodes.push({
					id: topic.id,
					label: topic.name,
					type: classifyTopic(topic, allTopics),
				});
			}
		}

		for (const topic of curriculum.topics) {
			for (const prereqId of topic.prerequisites) {
				const prereqTopic = findTopicById(allTopics, prereqId);
				if (
					prereqTopic &&
					nodeIds.has(prereqTopic.id) &&
					nodeIds.has(topic.id) &&
					prereqTopic.id !== topic.id
				) {
					const edgeKey = `${prereqTopic.id}->${topic.id}`;
					if (!edges.some((e) => `${e.from}->${e.to}` === edgeKey)) {
						edges.push({
							from: prereqTopic.id,
							to: topic.id,
							relation: "leads_to",
						});
					}
				}
			}
		}
	}

	return { nodes, edges };
}

function collectPrerequisiteChain(
	topic: CurriculumTopic,
	allTopics: Map<string, CurriculumTopic>,
	visited: Set<string>,
): CurriculumTopic[] {
	const result: CurriculumTopic[] = [];
	for (const prereqId of topic.prerequisites) {
		if (visited.has(prereqId)) continue;
		visited.add(prereqId);
		const prereq = findTopicById(allTopics, prereqId);
		if (prereq) {
			result.push(prereq);
			result.push(...collectPrerequisiteChain(prereq, allTopics, visited));
		}
	}
	return result;
}

function collectDependents(
	topic: CurriculumTopic,
	allTopics: Map<string, CurriculumTopic>,
	visited: Set<string>,
): CurriculumTopic[] {
	const result: CurriculumTopic[] = [];
	for (const t of allTopics.values()) {
		if (visited.has(t.id)) continue;
		if (t.prerequisites.includes(topic.id)) {
			visited.add(t.id);
			result.push(t);
			result.push(...collectDependents(t, allTopics, visited));
		}
	}
	return result;
}
