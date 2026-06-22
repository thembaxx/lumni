export function calculateBackoffDelay(attempts: number): number {
  const baseDelay = 1000;
  const maxDelay = 60000;
  const delay = Math.min(baseDelay * 2 ** attempts, maxDelay);
  return delay + Math.random() * 1000;
}
