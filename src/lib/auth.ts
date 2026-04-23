import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { neon } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";

if (!process.env.POSTGRES_URL) {
	throw new Error("POSTGRES_URL is not set");
}

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql, { schema });

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
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
});

export type Auth = typeof auth;
