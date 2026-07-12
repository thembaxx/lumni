import { curriculumRegistry } from "@/curriculum";
import { CachedAIGenerator } from "@/lib/ai/cached-ai-generator";
import { getAI } from "@/lib/ai/client";
import { dexieDataAccess } from "@/lib/db";
import type { CacheDataAccess } from "@/lib/db/data-access";
import { buildPromptInstruction, searchWithRAG } from "@/lib/tinyfish";
import { logError } from "@/lib/shared/logger";
import { buildKnowledgeCacheKey } from "./cache-key";
import { buildGraphFromCurriculum } from "./curriculum-graph";
import type { CachedGraph, KnowledgeGraph } from "./types";

const KNOWLEDGE_GRAPH_TTL = 7 * 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a knowledge graph generator for educational topics. Given a subject and topic, return a JSON object representing the prerequisite knowledge, core concepts, and advanced follow-up topics. Format:
{
  "nodes": [{ "id": string, "label": string, "type": "prerequisite" | "core" | "advanced" }],
  "edges": [{ "from": string, "to": string, "relation": string }]
}
Each node must have a unique id. Connect nodes with meaningful relation labels like "requires", "leads_to", "builds_on", "includes". Return 5-15 nodes total.`;

const config = {
  systemPrompt: SYSTEM_PROMPT,
  ttlMs: KNOWLEDGE_GRAPH_TTL,
  buildCacheKey: buildKnowledgeCacheKey,
  buildPrompt: (subject: string, topic: string) =>
    `Subject: ${subject}\nTopic: ${topic}\n\nGenerate a knowledge graph for this topic showing prerequisites, core concepts, and advanced topics.`,
  parseResponse: (content: string) => JSON.parse(content) as KnowledgeGraph,
  emptyResult: { nodes: [], edges: [] } as KnowledgeGraph,
  isEmpty: (result: KnowledgeGraph) => result.nodes.length === 0,
  getTable: (db: CacheDataAccess) => ({
    get: (key: string) => db.knowledgeGraph.get(key),
    put: (entry: unknown) => db.knowledgeGraph.put(entry as CachedGraph),
  }),
  buildCacheEntry: (key: string, data: KnowledgeGraph, ttlMs: number) =>
    ({
      key,
      graph: data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    }) satisfies CachedGraph,
  extractData: (cached: unknown) => (cached as CachedGraph).graph,
  errorLabel: "KnowledgeGraphService",
};

let _deps: { db: CacheDataAccess } = Object.freeze({ db: dexieDataAccess as CacheDataAccess });

function __setDepsForTesting(deps: { db: CacheDataAccess }) {
  _deps = Object.freeze({ ...deps });
}

function createGenerator() {
  return new CachedAIGenerator(config, getAI(), _deps.db);
}

async function buildFromCurriculum(subject: string, topic: string): Promise<KnowledgeGraph | null> {
  try {
    const curriculum = await curriculumRegistry.getSubject(subject);
    if (!curriculum) return null;

    const focusTopic = topic && topic !== "general" ? topic : undefined;
    const graph = buildGraphFromCurriculum(curriculum, focusTopic);
    return graph.nodes.length > 0 ? graph : null;
  } catch {
    return null;
  }
}

export async function fetchGraph(subject: string, topic: string): Promise<KnowledgeGraph> {
  const curriculumGraph = await buildFromCurriculum(subject, topic);
  if (curriculumGraph) return curriculumGraph;

  const ragContext = await searchWithRAG({ subject, topic });
  if (ragContext.xml) {
    const aiClient = getAI();
    const userPrompt = `${ragContext.xml}\n\n---\n\n${config.buildPrompt(subject, topic)}`;
    const systemPrompt = `${config.systemPrompt}\n\n${buildPromptInstruction()}`;
    const result = await aiClient.generateWithSystem(systemPrompt, userPrompt);
    if ("content" in result && result.content) {
      try {
        const graph = config.parseResponse(result.content);
        if (!config.isEmpty(graph)) {
          await storeGraph(subject, topic, graph);
          return graph;
        }
      } catch (err) {
        logError("KnowledgeGraph.fetchGraph.RAG", err);
      }
    }
  }

  return createGenerator().generate(subject, topic);
}

export async function getCachedGraph(
  subject: string,
  topic: string,
): Promise<KnowledgeGraph | null> {
  return createGenerator().getCached(subject, topic);
}

export async function storeGraph(
  subject: string,
  topic: string,
  graph: KnowledgeGraph,
): Promise<void> {
  return createGenerator().store(subject, topic, graph);
}
