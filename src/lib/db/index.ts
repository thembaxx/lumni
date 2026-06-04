export {
	APPWRITE_DATABASE_ID,
	COLLECTIONS,
	createDocument,
	deleteDocument,
	getDocument,
	listDocuments,
	updateDocument,
} from "./client";
export type {
	Collection,
	DataAccess,
	DataAccessTable,
	WhereClause,
} from "./data-access";
export { dexieDataAccess } from "./dexie-data-access";
export { InMemoryDataAccess, InMemoryTable } from "./in-memory-data-access";
