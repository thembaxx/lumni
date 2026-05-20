export class AppError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly status: number = 500,
		public readonly context?: Record<string, unknown>,
	) {
		super(message);
		this.name = "AppError";
	}

	static badRequest(message: string, context?: Record<string, unknown>) {
		return new AppError(message, "BAD_REQUEST", 400, context);
	}

	static notFound(message: string, context?: Record<string, unknown>) {
		return new AppError(message, "NOT_FOUND", 404, context);
	}

	static unauthorized(
		message = "Unauthorized",
		context?: Record<string, unknown>,
	) {
		return new AppError(message, "UNAUTHORIZED", 401, context);
	}

	static internal(message: string, context?: Record<string, unknown>) {
		return new AppError(message, "INTERNAL_ERROR", 500, context);
	}
}
