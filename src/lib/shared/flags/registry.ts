export const flagRegistry = {
  "daily-bolt-v2": {
    key: "daily-bolt-v2",
    description: "Daily bolt simplified vs two-step celebration flow",
    defaultEnabled: false,
    isExperiment: true,
    bucketKey: "daily-bolt-v2-1",
    experimentRatio: 0.5,
  },
  "personalized-feed": {
    key: "personalized-feed",
    description: "Gradual rollout of personalized quiz feed",
    defaultEnabled: true,
    rolloutPercentage: 50,
  },
} as const;
