import Database from "better-sqlite3";

const db = new Database("./local.db");
const tables = db
	.prepare("SELECT name FROM sqlite_master WHERE type='table'")
	.all() as { name: string }[];
console.log("Tables:", tables.map((t) => t.name).join(", "));
db.close();
