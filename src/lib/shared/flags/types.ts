export interface FlagDefinition {
  key: string;
  description: string;
  defaultEnabled: boolean;
  isExperiment?: boolean;
  bucketKey?: string;
  experimentRatio?: number;
  rolloutPercentage?: number;
}

export interface FlagOverride {
  key: string;
  enabled: boolean;
  userId?: string;
  rolloutPercentage?: number;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  variants: Array<{ id: string; name: string; traffic: number }>;
  startDate?: string;
  endDate?: string;
  status: "draft" | "running" | "paused" | "completed";
}

export interface ExperimentAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: string;
}

export type FlagRegistry = Record<string, FlagDefinition>;
