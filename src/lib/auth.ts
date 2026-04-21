import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./db/schema";

const sqlite = new Database("./local.db");
const db = drizzle(sqlite);

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
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
	],
});

export type Auth = typeof auth;
