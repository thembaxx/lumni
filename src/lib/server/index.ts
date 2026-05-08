// Keep exports from original locations to preserve "use server" boundaries
// DO NOT re-export from @/actions - it breaks the server boundary
export {
	adminUploadExamPaper,
	fetchSubjects,
	fetchUserProgress,
	getUserAccounts,
	toggleUserSubject,
} from "./actions";

export { fetchQuestions } from "./quiz-actions";

export {
	checkSubjectStatus,
	refreshSubject,
	syncAllSubjects,
	syncSubject,
} from "./sync-actions";
