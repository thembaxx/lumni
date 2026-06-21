import { describe, expect, test } from "vitest";
import type { SubjectCurriculum } from "@/curriculum/types";
import { buildGraphFromCurriculum } from "../curriculum-graph";

function makeCurriculum(
	topics: {
		id: string;
		name: string;
		prerequisites?: string[];
	}[],
): SubjectCurriculum {
	return {
		subjectId: "test",
		subjectName: "Test Subject",
		topics: topics.map((t) => ({
			id: t.id,
			name: t.name,
			order: 0,
			prerequisites: t.prerequisites ?? [],
			bloomTarget: "remember" as const,
			subtopics: [],
		})),
	};
}

describe("buildGraphFromCurriculum", () => {
	test("classifies topic with prereqs only as advanced", () => {
		const curriculum = makeCurriculum([
			{ id: "a", name: "Algebra" },
			{ id: "b", name: "Calculus", prerequisites: ["a"] },
		]);

		const graph = buildGraphFromCurriculum(curriculum);
		const calcNode = graph.nodes.find((n) => n.id === "b");

		expect(calcNode?.type).toBe("advanced");
	});

	test("classifies topic with dependents only as prerequisite", () => {
		const curriculum = makeCurriculum([
			{ id: "a", name: "Algebra" },
			{ id: "b", name: "Calculus", prerequisites: ["a"] },
		]);

		const graph = buildGraphFromCurriculum(curriculum);
		const algNode = graph.nodes.find((n) => n.id === "a");

		expect(algNode?.type).toBe("prerequisite");
	});

	test("classifies topic with both prereqs and dependents as core", () => {
		const curriculum = makeCurriculum([
			{ id: "a", name: "Algebra" },
			{ id: "b", name: "Functions", prerequisites: ["a"] },
			{ id: "c", name: "Calculus", prerequisites: ["b"] },
		]);

		const graph = buildGraphFromCurriculum(curriculum);
		const funcNode = graph.nodes.find((n) => n.id === "b");

		expect(funcNode?.type).toBe("core");
	});

	test("classifies topic with neither prereqs nor dependents as core", () => {
		const curriculum = makeCurriculum([{ id: "a", name: "Algebra" }]);

		const graph = buildGraphFromCurriculum(curriculum);
		const algNode = graph.nodes.find((n) => n.id === "a");

		expect(algNode?.type).toBe("core");
	});

	test("creates edges with leads_to relation", () => {
		const curriculum = makeCurriculum([
			{ id: "a", name: "Algebra" },
			{ id: "b", name: "Calculus", prerequisites: ["a"] },
		]);

		const graph = buildGraphFromCurriculum(curriculum);

		expect(graph.edges).toHaveLength(1);
		expect(graph.edges[0]).toEqual({
			from: "a",
			to: "b",
			relation: "leads_to",
		});
	});

	test("focus topic is marked as core", () => {
		const curriculum = makeCurriculum([
			{ id: "a", name: "Algebra" },
			{ id: "b", name: "Calculus", prerequisites: ["a"] },
		]);

		const graph = buildGraphFromCurriculum(curriculum, "b");
		const focusNode = graph.nodes.find((n) => n.id === "b");

		expect(focusNode?.type).toBe("core");
	});

	test("handles empty curriculum", () => {
		const curriculum = makeCurriculum([]);

		const graph = buildGraphFromCurriculum(curriculum);

		expect(graph.nodes).toHaveLength(0);
		expect(graph.edges).toHaveLength(0);
	});

	test("handles single-topic curriculum", () => {
		const curriculum = makeCurriculum([{ id: "a", name: "Algebra" }]);

		const graph = buildGraphFromCurriculum(curriculum);

		expect(graph.nodes).toHaveLength(1);
		expect(graph.nodes[0].type).toBe("core");
		expect(graph.edges).toHaveLength(0);
	});

	test("focus topic with nonexistent id returns empty graph", () => {
		const curriculum = makeCurriculum([{ id: "a", name: "Algebra" }]);

		const graph = buildGraphFromCurriculum(curriculum, "nonexistent");

		expect(graph.nodes).toHaveLength(0);
		expect(graph.edges).toHaveLength(0);
	});

	test("does not create duplicate edges", () => {
		const curriculum = makeCurriculum([
			{ id: "a", name: "Algebra" },
			{ id: "b", name: "Functions", prerequisites: ["a"] },
			{ id: "c", name: "Calculus", prerequisites: ["b"] },
		]);

		const graph = buildGraphFromCurriculum(curriculum);

		const edgeKeys = graph.edges.map((e) => `${e.from}->${e.to}`);
		const uniqueKeys = new Set(edgeKeys);
		expect(edgeKeys.length).toBe(uniqueKeys.size);
	});
});
