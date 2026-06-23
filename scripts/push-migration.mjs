import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const migrationFile = resolve("./drizzle/0001_many_silver_fox.sql");
  const sql = readFileSync(migrationFile, "utf-8");

  console.log("Would run migration:", sql.substring(0, 200));
  console.log("\nUse this connection to push:");
  console.log("POSTGRES_URL:", process.env.POSTGRES_URL?.substring(0, 30) + "...");
}

main().catch(console.error);
