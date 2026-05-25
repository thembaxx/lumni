export type GroupRole = "admin" | "member";

export type InviteStatus = "pending" | "accepted" | "expired";

export interface StudyGroup {
	$id: string;
	name: string;
	description?: string;
	subjectId?: string;
	inviteCode: string;
	createdBy: string;
	memberCount: number;
	createdAt: string;
}

export interface GroupMember {
	$id: string;
	groupId: string;
	userId: string;
	userName?: string;
	userEmail?: string;
	role: GroupRole;
	joinedAt: string;
	questionsAnswered?: number;
	currentStreak?: number;
}

export interface GroupInvite {
	$id: string;
	groupId: string;
	code: string;
	createdBy: string;
	status: InviteStatus;
	expiresAt: string;
	createdAt: string;
}

export interface CreateGroupInput {
	name: string;
	description?: string;
	subjectId?: string;
}

export interface JoinGroupInput {
	inviteCode: string;
}

export interface GroupPost {
	$id: string;
	groupId: string;
	userId: string;
	userName?: string;
	content: string;
	questionText?: string;
	subject?: string;
	topic?: string;
	createdAt: string;
}

export interface CreatePostInput {
	groupId: string;
	content: string;
	questionText?: string;
	subject?: string;
	topic?: string;
}
