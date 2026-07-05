import type { ExperimentConfig, FeatureFlag } from "./types";
import { assignUser } from "./bucketing";

export const experiments: ExperimentConfig[] = [
  {
    id: "onboarding-flow-v1",
    name: "Onboarding Flow v1",
    description: "Tests a simplified onboarding flow against the current multi-step flow",
    variants: [
      { id: "control", name: "Current flow", traffic: 50 },
      { id: "simplified", name: "Simplified flow", traffic: 50 },
    ],
    status: "running",
  },
];

export const featureFlags: FeatureFlag[] = [
  {
    flagKey: "new-onboarding",
    experimentId: "onboarding-flow-v1",
    variantMap: {
      control: false,
      simplified: true,
    },
  },
];

export function getExperimentConfig(experimentId: string): ExperimentConfig | undefined {
  return experiments.find((e) => e.id === experimentId);
}

export function getFeatureFlag(flagKey: string): FeatureFlag | undefined {
  return featureFlags.find((f) => f.flagKey === flagKey);
}

export function evaluateFlag(
  userId: string,
  flagKey: string,
): { variantId: string; flagValue: boolean } | null {
  const flag = getFeatureFlag(flagKey);
  if (!flag) return null;
  const experiment = getExperimentConfig(flag.experimentId);
  if (!experiment) return null;
  if (experiment.status !== "running") return null;
  const variantId = assignUser(userId, experiment);
  const flagValue = flag.variantMap[variantId] ?? false;
  return { variantId, flagValue };
}

export function evaluateExperiment(
  userId: string,
  experimentId: string,
): { variantId: string; flagValue: boolean } | null {
  const experiment = getExperimentConfig(experimentId);
  if (!experiment) return null;
  if (experiment.status !== "running") return null;
  const variantId = assignUser(userId, experiment);
  const matchingFlag = featureFlags.find((f) => f.experimentId === experimentId);
  const flagValue = matchingFlag ? (matchingFlag.variantMap[variantId] ?? false) : false;
  return { variantId, flagValue };
}
