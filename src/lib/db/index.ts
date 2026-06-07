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
	CacheDataAccess,
	Collection,
	CompetencyDataAccess,
	ContentDataAccess,
	DataAccess,
	DataAccessTable,
	FlashcardDataAccess,
	LegacyDataAccess,
	ObservabilityDataAccess,
	QuizDataAccess,
	SocialDataAccess,
	StudyDataAccess,
	SyncDataAccess,
	WhereClause,
} from "./data-access";
export { dexieDataAccess } from "./dexie-data-access";
export { InMemoryDataAccess, InMemoryTable } from "./in-memory-data-access";
