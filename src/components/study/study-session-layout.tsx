"use client";

import { SessionActive } from "./session-active";
import { SessionEmpty } from "./session-empty";
import { SessionIdle } from "./session-idle";
import { SessionLoading } from "./session-loading";
import { SessionResults } from "./session-results";

export type SessionState = "idle" | "loading" | "active" | "empty" | "complete";

export interface StudySessionStats {
	total: number;
	correct?: number;
	review?: number;
}

export interface SessionActivity {
	questionNumber: number;
	totalQuestions: number;
	elapsedTime: number;
	accuracy: number;
	progress: number;
}

interface StudySessionLayoutProps {
	state: SessionState;
	selectedSubject: string;
	isLoading?: boolean;
	stats?: StudySessionStats;
	activity?: SessionActivity;
	children?: React.ReactNode;
	onQuit?: () => void;
	onRestart?: () => void;
	onSubjectSelect?: (subject: string) => void;
}

export function StudySessionLayout({
	state,
	selectedSubject,
	isLoading = false,
	stats,
	activity,
	children,
	onQuit,
	onRestart,
	onSubjectSelect,
}: StudySessionLayoutProps) {
	if (state === "complete" && stats) {
		return (
			<SessionResults stats={stats} onQuit={onQuit} onRestart={onRestart} />
		);
	}

	if (state === "empty") {
		return <SessionEmpty subject={selectedSubject} onGoBack={onQuit!} />;
	}

	if (state === "loading" || isLoading) {
		return <SessionLoading />;
	}

	if (state === "idle") {
		return <SessionIdle onSelect={onSubjectSelect} />;
	}

	return (
		<SessionActive activity={activity} onQuit={onQuit}>
			{children}
		</SessionActive>
	);
}
