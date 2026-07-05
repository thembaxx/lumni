import type { ExperimentConfig } from "./types";

export function djb2Hash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function assignUser(userId: string, experiment: ExperimentConfig): string {
  const hash = djb2Hash(`${userId}:${experiment.id}`);
  const bucket = hash % 100;
  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.traffic;
    if (bucket < cumulative) {
      return variant.id;
    }
  }
  return experiment.variants[experiment.variants.length - 1].id;
}
