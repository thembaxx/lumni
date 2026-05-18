export class SafePersistError extends Error {
	constructor(
		public label: string,
		cause: unknown,
	) {
		super(`[safePersist] ${label} failed`);
		this.name = "SafePersistError";
	}
}

export async function safePersist<R = void>(
	label: string,
	write: () => Promise<R>,
): Promise<R> {
	try {
		return await write();
	} catch (err) {
		console.warn(`[safePersist] ${label} failed:`, err);
		throw new SafePersistError(label, err);
	}
}
