import { dexieDataAccess } from "@/lib/db";
import type { SyncDataAccess } from "@/lib/db/data-access";
import type { SyncConflict } from "../schema";

export class ConflictRepository {
  constructor(private db: SyncDataAccess) {}

  async save(conflict: Omit<SyncConflict, "id" | "resolvedAt" | "resolution">): Promise<number> {
    return this.db.conflicts.add({ ...conflict, resolvedAt: 0 } as SyncConflict);
  }

  async getUnresolved(): Promise<SyncConflict[]> {
    return this.db.conflicts.where("resolvedAt").equals(0).toArray();
  }

  async resolve(id: number, resolution: "local" | "server" | "merged"): Promise<void> {
    await this.db.conflicts.update(id, {
      resolvedAt: Date.now(),
      resolution,
    });
  }

  async clearResolved(): Promise<void> {
    const resolved = (await this.db.conflicts.toArray()).filter(
      (c: SyncConflict) => !!c.resolvedAt,
    );
    await Promise.all(resolved.map((c: SyncConflict) => this.db.conflicts.delete(c.id)));
  }
}

export function createConflictRepository(db: SyncDataAccess = dexieDataAccess) {
  return new ConflictRepository(db);
}
export const conflictRepo = createConflictRepository();
