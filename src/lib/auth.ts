import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { neon } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";

const POSTGRES_URL = process.env.POSTGRES_URL;

function validateEnvironment(): void {
	if (!POSTGRES_URL) {
		throw new Error(
			"POSTGRES_URL environment variable is not set. Auth requires a database connection.",
		);
	}
}

let authInstance: ReturnType<typeof betterAuth> | null = null;

function initAuth(): ReturnType<typeof betterAuth> {
	validateEnvironment();
	const sql = neon(POSTGRES_URL!);
	const db = drizzle(sql, { schema });

	// biome-disable-next-line lint/suspicious/noExplicitAny
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
			// biome-disable-next-line lint/suspicious/noExplicitAny
		}) as any,
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			cookieCache: {
				maxAge: 60 * 60 * 24,
			},
		},
		rateLimit: {
			enabled: true,
			window: 60,
			max: 10,
			storage: "database",
		},
		advanced: {
			useSecureCookies: process.env.NODE_ENV === "production",
		},
		trustedOrigins: [
			process.env.BETTER_AUTH_URL || "http://localhost:3000",
			"http://localhost:3000",
			"https://lumni.ai",
			"https://lumni-psi.vercel.app",
		],
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID || "",
				clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
			},
			twitter: {
				clientId: process.env.TWITTER_CLIENT_ID || "",
				clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
			},
		},
		// biome-disable-next-line lint/suspicious/noExplicitAny
	} as any);
}

export function getAuth() {
	if (!POSTGRES_URL) {
		throw new Error(
			"POSTGRES_URL is not set. Authentication is disabled. Set POSTGRES_URL to enable auth.",
		);
	}
	if (!authInstance) {
		authInstance = initAuth();
	}
	return authInstance;
}

export const auth = POSTGRES_URL
	? initAuth()
	: ({} as ReturnType<typeof betterAuth>);
