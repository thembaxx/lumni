export function startViewTransition(
	callback: () => void,
): { finished: Promise<void> } | null {
	if (typeof document === "undefined") return null;
	const d = document as Document & {
		startViewTransition?: (cb: () => void | Promise<void>) => {
			finished: Promise<void>;
		};
	};
	if (!d.startViewTransition) return null;
	return d.startViewTransition(callback);
}
