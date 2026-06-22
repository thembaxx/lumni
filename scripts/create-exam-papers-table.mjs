import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });

async function withRetry(fn, maxRetries = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      console.log(
        `  Attempt ${attempt}/${maxRetries} failed:`,
        e.message.split("\n")[0].substring(0, 80),
      );
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw new Error("All retries failed");
}

async function main() {
  const maxRetries = 5;

  // Connect and retry CREATE TABLE multiple times
  console.log("Connecting to database...");

  await withRetry(
    async () => {
      const sql = neon(process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL);
      console.log("Creating table...");
      await sql`CREATE TABLE IF NOT EXISTS exam_paper (
      id text PRIMARY KEY NOT NULL,
      subject_id text NOT NULL,
      year integer NOT NULL,
      paper_number integer NOT NULL,
      type text NOT NULL,
      memo_id text,
      file_url text NOT NULL,
      file_key text NOT NULL,
      original_file_name text,
      uploaded_at timestamp DEFAULT now() NOT NULL
    )`;
      console.log("✓ Table created!");
    },
    maxRetries,
    3000,
  );

  await withRetry(
    async () => {
      const sql = neon(process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL);
      console.log("Creating subject_id index...");
      await sql`CREATE INDEX IF NOT EXISTS exam_paper_subjectId_idx ON exam_paper (subject_id)`;
    },
    maxRetries,
    3000,
  );

  await withRetry(
    async () => {
      const sql = neon(process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL);
      console.log("Creating composite index...");
      await sql`CREATE INDEX IF NOT EXISTS exam_paper_subjectId_year_paperNumber_type_idx ON exam_paper (subject_id, year, paper_number, type)`;
    },
    maxRetries,
    3000,
  );

  console.log("\n✓ Done! exam_paper table is ready.");
}

main().catch((e) => {
  console.error("\nError:", e.message);
  process.exit(1);
});
