import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { seedDatabase } from "@/lib/seed";
import { logError } from "@/lib/shared/logger";

const CSRF_TOKEN_KEY = "x-csrf-token";
const ENV_TOKEN = process.env.SEED_CSRF_TOKEN || "";

function isValidRequest(request: Request): boolean {
	const csrf = request.headers.get(CSRF_TOKEN_KEY);
	if (!ENV_TOKEN) {
		logError(
			"SeedCSRF",
			new Error("SEED_CSRF_TOKEN env not set — refusing request"),
		);
		return false;
	}
	if (csrf !== ENV_TOKEN) {
		logError("SeedCSRF", new Error("Seed CSRF token mismatch"));
		return false;
	}
	const origin = request.headers.get("origin");
	const host = request.headers.get("host");
	if (
		origin &&
		host &&
		!origin.includes(host) &&
		!origin.includes("localhost") &&
		!origin.includes("127.0.0.1")
	) {
		logError(
			"SeedCSRF",
			new Error(`Seed origin mismatch: ${origin} vs ${host}`),
		);
		return false;
	}
	return true;
}

export const POST = createRouteHandler({
	auth: "none",
	errorLabel: "Seed",
	execute: async ({ req }) => {
		if (!isValidRequest(req)) {
			throw new HttpError(403, "Unauthorized");
		}

		await seedDatabase();
		return {
			success: true,
			message: "Database seeded successfully",
		};
	},
});

export const GET = createRouteHandler({
	auth: "none",
	errorLabel: "Seed",
	execute: async () => {
		return {
			message: "Use POST to seed the database",
		};
	},
});
