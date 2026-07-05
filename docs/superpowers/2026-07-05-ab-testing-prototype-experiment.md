# Prototype Experiment: Onboarding Flow v1

## Hypothesis

A simplified onboarding flow will increase the completion rate of the onboarding process by at least 15%.

## Experiment ID

`onboarding-flow-v1`

## Variants

| Variant     | Traffic | Description                                 |
|-------------|---------|---------------------------------------------|
| control     | 50%     | Current multi-step onboarding flow          |
| simplified  | 50%     | Reduced 3-step flow with fewer form fields  |

## Feature Flag

| Flag            | Experiment ID       | control | simplified |
|-----------------|---------------------|---------|------------|
| `new-onboarding` | `onboarding-flow-v1` | `false` | `true`     |

## Success Metrics

- Onboarding completion rate
- Time to complete onboarding
- Subject selection completion rate

## How to Use

```tsx
const { flag, isLoading } = useExperiment("onboarding-flow-v1");

if (isLoading) return <Loading />;

return flag ? <SimplifiedOnboarding /> : <CurrentOnboarding />;
```
