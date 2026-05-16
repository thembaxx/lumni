export async function safePersist<R = void>(
	label: string,
	write: () => Promise<R>,
	enqueue?: (result: R) => Promise<void>,
): Promise<R | undefined> {
	try {
		const result = await write();
		if (enqueue) {
			await enqueue(result).catch(() => {});
		}
		return result;
	} catch (err) {
		console.warn(`[safePersist] ${label} failed:`, err);
	}
}
