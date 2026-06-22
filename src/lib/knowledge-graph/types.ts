export interface KnowledgeNode {
  id: string;
  label: string;
  type: "prerequisite" | "core" | "advanced";
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  relation: string;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface CachedGraph {
  key: string;
  graph: KnowledgeGraph;
  createdAt: number;
  expiresAt: number;
}
