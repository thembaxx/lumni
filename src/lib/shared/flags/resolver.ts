import type { FlagDefinition, FlagOverride } from "./types";
import { flagRegistry as defaultRegistry } from "./registry";

export function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return hash >>> 0;
}

export function bucketUser(
  userId: string,
  bucketKey: string,
  totalBuckets: number,
): number {
  const hash = djb2Hash(`${userId}:${bucketKey}`);
  return hash % totalBuckets;
}

export function isFlagEnabled(
  flagKey: string,
  userId?: string,
  overrides?: FlagOverride[],
  flags?: Record<string, FlagDefinition>,
): boolean {
  const resolvedFlags = flags ?? (defaultRegistry as unknown as Record<string, FlagDefinition>);
  const definition = resolvedFlags[flagKey];
  if (!definition) return false;

  if (overrides && overrides.length > 0) {
    const userOverride = overrides.find(
      (o) => o.key === flagKey && o.userId && o.userId === userId,
    );
    if (userOverride !== undefined) return userOverride.enabled;

    const globalOverride = overrides.find(
      (o) => o.key === flagKey && !o.userId,
    );
    if (globalOverride !== undefined) return globalOverride.enabled;
  }

  if (definition.isExperiment && definition.bucketKey !== undefined && userId) {
    const ratio = definition.experimentRatio ?? 0.5;
    const bucketMax = 100;
    const bucket = bucketUser(userId, definition.bucketKey, bucketMax);
    return bucket < ratio * bucketMax;
  }

  if (definition.rolloutPercentage !== undefined && userId) {
    const bucketMax = 100;
    const bucket = bucketUser(userId, flagKey, bucketMax);
    return bucket < definition.rolloutPercentage;
  }

  return definition.defaultEnabled;
}
