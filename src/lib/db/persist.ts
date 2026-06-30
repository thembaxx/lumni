import { logError } from "@/lib/shared/logger";

export class SafePersistError extends Error {
  constructor(
    public label: string,
    public cause: unknown,
  ) {
    super(`[safePersist] ${label} failed`);
    this.name = "SafePersistError";
  }
}

export async function safePersist<R = void>(label: string, write: () => Promise<R>): Promise<R> {
  try {
    return await write();
  } catch (err) {
    logError(`SafePersist.${label}`, err);
    throw new SafePersistError(label, err);
  }
}
