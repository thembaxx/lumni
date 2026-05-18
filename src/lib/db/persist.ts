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
	enqueue?: (result: R) => Promise<void>,
): Promise<R> {
	try {
		const result = await write();
		if (enqueue) {
			await enqueue(result);
		}
		return result;
	} catch (err) {
		console.warn(`[safePersist] ${label} failed:`, err);
		throw new SafePersistError(label, err);
	}
}
