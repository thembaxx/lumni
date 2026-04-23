import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.POSTGRES_URL) {
	throw new Error("POSTGRES_URL is not set in environment variables");
}

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql, { schema });

export { db, schema, sql };

export function getDb() {
	return db;
}
