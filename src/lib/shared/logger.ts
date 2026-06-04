import { captureException, withScope } from "@sentry/nextjs";

export function logError(
	context: string,
	error: unknown,
	meta?: Record<string, unknown>,
) {
	if (process.env.NODE_ENV === "development") {
		console.error(`[${context}]`, error, meta ?? "");
	}

	if (process.env.NODE_ENV === "production") {
		withScope((scope) => {
			scope.setTag("context", context);
			if (meta) {
				scope.setExtras(meta);
			}
			captureException(error);
		});
	}
}
