import { getAI } from "@/lib/ai/client";
import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";
import { buildKnowledgeCacheKey } from "./cache-key";
import type { CachedGraph, KnowledgeGraph } from "./types";

const DEFAULT_DEPS = { db: dexieDataAccess };
let _deps = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: DataAccess }) {
	_deps = deps;
}

const KNOWLEDGE_GRAPH_TTL = 7 * 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a knowledge graph generator for educational topics. Given a subject and topic, return a JSON object representing the prerequisite knowledge, core concepts, and advanced follow-up topics. Format:
{
  "nodes": [{ "id": string, "label": string, "type": "prerequisite" | "core" | "advanced" }],
  "edges": [{ "from": string, "to": string, "relation": string }]
}
Each node must have a unique id. Connect nodes with meaningful relation labels like "requires", "leads_to", "builds_on", "includes". Return 5-15 nodes total.`;

export async function fetchGraph(
	subject: string,
	topic: string,
): Promise<KnowledgeGraph> {
	const ai = getAI();
	const prompt = `Subject: ${subject}\nTopic: ${topic}\n\nGenerate a knowledge graph for this topic showing prerequisites, core concepts, and advanced topics.`;
	const result = await ai.generateWithSystem(SYSTEM_PROMPT, prompt);
	if (!("content" in result) || !result.content) {
		return { nodes: [], edges: [] };
	}
	try {
		const parsed = JSON.parse(result.content) as KnowledgeGraph;
		return parsed;
	} catch (err) {
		logError("KnowledgeGraphService", err);
		return { nodes: [], edges: [] };
	}
}

export async function getCachedGraph(
	subject: string,
	topic: string,
): Promise<KnowledgeGraph | null> {
	try {
		const key = buildKnowledgeCacheKey(subject, topic);
		const cached = await _deps.db.knowledgeGraph.get(key);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.graph;
		}
	} catch {
		// IndexedDB unavailable (server-side)
	}
	return null;
}

export async function storeGraph(
	subject: string,
	topic: string,
	graph: KnowledgeGraph,
): Promise<void> {
	try {
		const key = buildKnowledgeCacheKey(subject, topic);
		const entry: CachedGraph = {
			key,
			graph,
			createdAt: Date.now(),
			expiresAt: Date.now() + KNOWLEDGE_GRAPH_TTL,
		};
		await _deps.db.knowledgeGraph.put(entry);
	} catch {
		// IndexedDB unavailable (server-side)
	}
}
