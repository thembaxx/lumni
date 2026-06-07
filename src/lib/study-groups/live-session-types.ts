export interface LiveSession {
	$id: string;
	groupId: string;
	startedBy: string;
	startedByName?: string;
	subject?: string;
	status: "active" | "ended";
	startedAt: string;
	endedAt?: string;
	participantCount: number;
}

export interface LiveSessionParticipant {
	$id: string;
	sessionId: string;
	userId: string;
	userName?: string;
	joinedAt: string;
	status: "active" | "left";
	currentActivity?: string;
}
