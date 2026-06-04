import { dexieDataAccess } from "@/lib/db";
import type { SyncConflict } from "../schema";

export async function saveConflict(
	conflict: Omit<SyncConflict, "id" | "resolvedAt" | "resolution">,
): Promise<number> {
	return dexieDataAccess.conflicts.add(conflict as SyncConflict);
}

export async function getUnresolvedConflicts(): Promise<SyncConflict[]> {
	return (await dexieDataAccess.conflicts.toArray()).filter(
		(c) => !c.resolvedAt,
	);
}

export async function resolveConflict(
	id: number,
	resolution: "local" | "server" | "merged",
	_mergedData?: unknown,
): Promise<void> {
	await dexieDataAccess.conflicts.update(id, {
		resolvedAt: Date.now(),
		resolution,
	});
}

export async function clearResolvedConflicts(): Promise<void> {
	const resolved = (await dexieDataAccess.conflicts.toArray()).filter(
		(c) => !!c.resolvedAt,
	);
	await Promise.all(
		resolved.map((c) => dexieDataAccess.conflicts.delete(c.id ?? 0)),
	);
}
