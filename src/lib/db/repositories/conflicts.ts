import { offlineDB, type SyncConflict } from "../schema";

export async function saveConflict(
	conflict: Omit<SyncConflict, "id" | "resolvedAt" | "resolution">,
): Promise<number> {
	return offlineDB.conflicts.add(conflict as SyncConflict);
}

export async function getUnresolvedConflicts(): Promise<SyncConflict[]> {
	return offlineDB.conflicts.filter((c) => !c.resolvedAt).toArray();
}

export async function resolveConflict(
	id: number,
	resolution: "local" | "server" | "merged",
	_mergedData?: unknown,
): Promise<void> {
	await offlineDB.conflicts.update(id, {
		resolvedAt: Date.now(),
		resolution,
	});
}

export async function clearResolvedConflicts(): Promise<void> {
	await offlineDB.conflicts.filter((c) => !!c.resolvedAt).delete();
}
