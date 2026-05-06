import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { neon } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";

const POSTGRES_URL = process.env.POSTGRES_URL;

let authInstance: ReturnType<typeof betterAuth> | null = null;

function getPostgresUrl(): string {
	if (!POSTGRES_URL) {
		throw new Error("POSTGRES_URL is not set");
	}
	return POSTGRES_URL;
}

function initAuth(): ReturnType<typeof betterAuth> {
	const sql = neon(getPostgresUrl());
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
		// biome-disable-next-line lint/suspicious/noExplicitAny
	} as any);
}

export function getAuth() {
	if (!authInstance) {
		authInstance = initAuth();
	}
	return authInstance;
}

// biome-disable-next-line lint/suspicious/noExplicitAny
export const auth = POSTGRES_URL ? initAuth() : ({} as any);
