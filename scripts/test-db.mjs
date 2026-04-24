import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env.local"), override: true });

console.log("POSTGRES_URL:", process.env.POSTGRES_URL?.substring(0, 30) + "...");

if (!process.env.POSTGRES_URL) {
  console.error("No POSTGRES_URL found!");
  process.exit(1);
}

const { neon } = await import('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL);

const rows = await sql`select id, code from subject limit 3`;
console.log("Subjects in DB:", JSON.stringify(rows, null, 2));