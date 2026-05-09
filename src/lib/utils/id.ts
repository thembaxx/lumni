export function generateId(): string {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateFlashcardId(questionId?: string): string {
	if (questionId) {
		return `fc_${questionId}_${Date.now()}`;
	}
	return `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateQuizId(): string {
	return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSubjectId(): string {
	return `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
