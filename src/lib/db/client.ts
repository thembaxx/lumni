import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is not set in environment variables");
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

export { db, schema, sql };

export function getDb() {
	return db;
}
