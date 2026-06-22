import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import type { SyncConflict } from "../schema";

export class ConflictRepository {
  constructor(private db: DataAccess) {}

  async save(conflict: Omit<SyncConflict, "id" | "resolvedAt" | "resolution">): Promise<number> {
    return this.db.conflicts.add(conflict as SyncConflict);
  }

  async getUnresolved(): Promise<SyncConflict[]> {
    return (await this.db.conflicts.toArray()).filter((c) => !c.resolvedAt);
  }

  async resolve(id: number, resolution: "local" | "server" | "merged"): Promise<void> {
    await this.db.conflicts.update(id, {
      resolvedAt: Date.now(),
      resolution,
    });
  }

  async clearResolved(): Promise<void> {
    const resolved = (await this.db.conflicts.toArray()).filter((c) => !!c.resolvedAt);
    await Promise.all(resolved.map((c) => this.db.conflicts.delete(c.id)));
  }
}

export function createConflictRepository(db: DataAccess = dexieDataAccess) {
  return new ConflictRepository(db);
}
export const conflictRepo = createConflictRepository();
