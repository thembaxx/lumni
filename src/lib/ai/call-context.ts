export interface AICallContext {
	consentGranted?: boolean;
}

interface AICallStorage {
	run<T>(ctx: AICallContext, fn: () => T): T;
	getStore(): AICallContext | undefined;
}

const noopStorage: AICallStorage = {
	run: <T>(_ctx: AICallContext, fn: () => T): T => fn(),
	getStore: () => undefined,
};

const storage: AICallStorage = (() => {
	const Ctor = (
		globalThis as unknown as {
			AsyncLocalStorage?: new () => AICallStorage;
		}
	).AsyncLocalStorage;
	return Ctor ? new Ctor() : noopStorage;
})();

export function runWithAICallContext<T>(ctx: AICallContext, fn: () => T): T {
	return storage.run(ctx, fn);
}

export function getAICallContext(): AICallContext | undefined {
	return storage.getStore();
}
