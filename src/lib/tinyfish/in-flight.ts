const inFlight = new Map<string, Promise<unknown>>();

export async function deduped<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const promise = factory().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}

export function inFlightSize(): number {
  return inFlight.size;
}

export function clearInFlight(): void {
  inFlight.clear();
}

export function hasInFlight(key: string): boolean {
  return inFlight.has(key);
}
