import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export function getDb() {
	if (!DATABASE_URL) {
		throw new Error("DATABASE_URL is not set in environment variables");
	}
	const sql = neon(DATABASE_URL);
	return drizzle(sql, { schema });
}

export function getSql() {
	if (!DATABASE_URL) {
		throw new Error("DATABASE_URL is not set in environment variables");
	}
	return neon(DATABASE_URL);
}

const db = DATABASE_URL ? drizzle(neon(DATABASE_URL), { schema }) : null;

const sql = DATABASE_URL
	? neon(DATABASE_URL)
	: ((() => {
			throw new Error("DATABASE_URL is not set in environment variables");
		}) as unknown as ReturnType<typeof neon>);

export { db as db, schema, sql as sql };
