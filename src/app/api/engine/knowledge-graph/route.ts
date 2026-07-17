import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { ensureAI } from "@/lib/ai";
import { fetchGraph, getCachedGraph, storeGraph } from "@/lib/knowledge-graph/service";
import type { KnowledgeGraph } from "@/lib/knowledge-graph/types";

const EMPTY_GRAPH: KnowledgeGraph = { nodes: [], edges: [] };

async function handleGraphFetch(subject: string, topic: string) {
  const cached = await getCachedGraph(subject, topic);
  if (cached) return cached;

  if (!ensureAI()) return EMPTY_GRAPH;

  const graph = await fetchGraph(subject, topic);

  if (graph.nodes.length === 0) {
    return EMPTY_GRAPH;
  }

  await storeGraph(subject, topic, graph);

  return graph;
}

export const GET = createRouteHandler({
  auth: "required",
  execute: async ({ userId, req }) => {
    const subject = req.nextUrl.searchParams.get("subject");
    const topic = req.nextUrl.searchParams.get("topic");
    if (!subject || !topic) {
      throw new HttpError(400, "subject and topic are required");
    }
    return handleGraphFetch(subject, topic);
  },
  errorLabel: "KnowledgeGraph",
});

export const POST = createRouteHandler({
  auth: "required",
  validate: (body: { subject?: string; topic?: string }) => {
    if (!body.subject || !body.topic) return "subject and topic are required";
    return null;
  },
  execute: async ({ body }: { body: { subject: string; topic: string } }) => {
    const { subject, topic } = body;
    return handleGraphFetch(subject, topic);
  },
  errorLabel: "KnowledgeGraph",
  useRateLimit: true,
});
