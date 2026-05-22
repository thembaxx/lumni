export interface ExamSlot {
	id: string;
	subject: string;
	subjectId: string;
	paperNumber: number;
	session: "may-june" | "oct-nov";
	year: number;
	date: string;
	startTime: string;
	endTime: string;
	durationHours: number;
	isSC?: boolean;
}

export interface ExamDateCollection {
	id: string;
	session: string;
	year: number;
	slots: ExamSlot[];
	updatedAt: string;
	source: string;
}

export function getCurrentSession(): {
	session: "may-june" | "oct-nov";
	year: number;
} {
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();
	if (month <= 6) return { session: "may-june", year };
	if (month >= 10) return { session: "oct-nov", year };
	return { session: "oct-nov", year };
}
