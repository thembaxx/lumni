"use client";

import { Home, RotateCcw, Target, Timer } from "lucide-react";
import { useMemo } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { calculateAccuracy, formatTime } from "@/lib/utils/time";

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
			<SessionComplete stats={stats} onQuit={onQuit} onRestart={onRestart} />
		);
	}

	if (state === "empty") {
		return <EmptySession subject={selectedSubject} onGoBack={onQuit!} />;
	}

	if (state === "loading" || isLoading) {
		return <LoadingSession />;
	}

	if (state === "idle") {
		return (
			<IdleSession
				title="Start Learning"
				description="Select a subject to begin studying"
				icon={<Target className="size-8" />}
				onSelect={onSubjectSelect}
			/>
		);
	}

	return (
		<ActiveSession activity={activity} stats={stats} onQuit={onQuit}>
			{children}
		</ActiveSession>
	);
}

interface IdleSessionProps {
	title: string;
	description: string;
	icon: React.ReactNode;
	onSelect?: (subject: string) => void;
}

function IdleSession({ title, description, icon, onSelect }: IdleSessionProps) {
	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">{title}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">{icon}</EmptyMedia>
							<EmptyTitle>{title}</EmptyTitle>
							<EmptyDescription>{description}</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							{onSelect && (
								<SubjectsDrawer onSelect={onSelect}>
									<Button>Choose Subject</Button>
								</SubjectsDrawer>
							)}
						</EmptyContent>
					</Empty>
				</CardContent>
			</Card>
		</div>
	);
}

function LoadingSession() {
	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardContent className="p-8 text-center">
					<p className="text-muted-foreground">Loading...</p>
				</CardContent>
			</Card>
		</div>
	);
}

interface EmptySessionProps {
	subject: string;
	onGoBack: () => void;
}

function EmptySession({ subject, onGoBack }: EmptySessionProps) {
	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardHeader className="text-center">
					<CardTitle>No Content</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No content found</EmptyTitle>
							<EmptyDescription>
								Upload questions for {subject} to start studying
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
					<Button variant="outline" className="w-full" onClick={onGoBack}>
						Go Back
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

interface SessionCompleteProps {
	stats: StudySessionStats;
	onQuit?: () => void;
	onRestart?: () => void;
}

function SessionComplete({ stats, onQuit, onRestart }: SessionCompleteProps) {
	const accuracy = calculateAccuracy(stats.correct ?? 0, stats.total);

	return (
		<div className="min-h-screen bg-background p-4 flex items-center justify-center">
			<Card className="max-w-md w-full">
				<CardHeader className="text-center">
					<CardTitle>Session Complete!</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-3 gap-4 text-center">
						<div className="p-4 rounded-lg bg-muted">
							<p className="text-2xl font-bold">{stats.total}</p>
							<p className="text-xs text-muted-foreground">Total</p>
						</div>
						{stats.correct !== undefined && (
							<div className="p-4 rounded-lg bg-green-500/10">
								<p className="text-2xl font-bold text-green-500">
									{stats.correct}
								</p>
								<p className="text-xs text-green-500">Known</p>
							</div>
						)}
						{stats.review !== undefined && (
							<div className="p-4 rounded-lg bg-amber-500/10">
								<p className="text-2xl font-bold text-amber-500">
									{stats.review}
								</p>
								<p className="text-xs text-amber-500">Review</p>
							</div>
						)}
					</div>
					{stats.correct !== undefined && (
						<div className="flex items-center justify-center gap-2">
							<Target className="size-4 text-green-500" />
							<span className="text-sm font-medium text-green-500">
								{accuracy}% accuracy
							</span>
						</div>
					)}
					<div className="flex gap-2">
						{onQuit && (
							<Button variant="outline" className="flex-1" onClick={onQuit}>
								<Home className="size-4 mr-2" />
								Dashboard
							</Button>
						)}
						{onRestart && (
							<Button className="flex-1" onClick={onRestart}>
								<RotateCcw className="size-4 mr-2" />
								Try Again
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

interface ActiveSessionProps {
	activity?: SessionActivity;
	stats?: StudySessionStats;
	onQuit?: () => void;
	children: React.ReactNode;
}

function ActiveSession({
	activity,
	stats,
	onQuit,
	children,
}: ActiveSessionProps) {
	const progressValue = activity?.progress ?? 0;

	return (
		<div className="min-h-screen bg-background p-4 space-y-4">
			<div className="flex items-center justify-between">
				{onQuit && (
					<Button variant="ghost" size="sm" onClick={onQuit}>
						Quit
					</Button>
				)}
				{activity && (
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
							<Timer className="size-3.5 text-muted-foreground" />
							<span className="text-sm font-medium tabular-nums font-mono">
								{formatTime(activity.elapsedTime)}
							</span>
						</div>
						<span className="text-muted-foreground">|</span>
						<Badge variant="secondary" className="font-mono">
							{activity.questionNumber}/{activity.totalQuestions}
						</Badge>
						{activity.accuracy > 0 && (
							<>
								<span className="text-muted-foreground">|</span>
								<div className="flex items-center gap-1.5">
									<Target className="size-3.5 text-green-500" />
									<span className="text-sm font-semibold tabular-nums font-mono text-green-500">
										{activity.accuracy}%
									</span>
								</div>
							</>
						)}
					</div>
				)}
			</div>

			{progressValue > 0 && (
				<Progress value={progressValue} className="h-1.5" />
			)}

			{children}
		</div>
	);
}
