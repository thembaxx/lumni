export function buildKnowledgeCacheKey(subject: string, topic: string): string {
  return `${subject.toLowerCase()}:${topic.toLowerCase()}`;
}
