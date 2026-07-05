export interface ExperimentVariant {
  id: string;
  name: string;
  traffic: number;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  variants: ExperimentVariant[];
  startDate?: string;
  endDate?: string;
  status: "draft" | "running" | "paused" | "completed";
}

export interface ExperimentAssignment {
  id?: number;
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: string;
}

export interface FeatureFlag {
  flagKey: string;
  experimentId: string;
  variantMap: Record<string, boolean>;
}
