import type { NextRequest } from "next/server";
import { ensureAI } from "@/lib/ai";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { getAuthenticatedUserId } from "@/lib/server/auth";
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

export const GET = async (request: NextRequest) => {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  const subject = request.nextUrl.searchParams.get("subject");
  const topic = request.nextUrl.searchParams.get("topic");
  if (!subject || !topic) {
    return Response.json({ error: "subject and topic are required" }, { status: 400 });
  }
  const graph = await handleGraphFetch(subject, topic);
  return Response.json(graph);
};

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
});
