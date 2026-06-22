"use client";

import Logout01Icon from "@hugeicons/core-free-icons/Logout01Icon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon";
import UserMultipleIcon from "@hugeicons/core-free-icons/UserMultipleIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useEndSession,
	useJoinSession,
	useLeaveSession,
	useLiveSession,
	useStartSession,
	useUpdateActivity,
} from "@/hooks/use-live-session";
import { useAuth } from "@/lib/auth/auth-context";
import type { LiveSessionParticipant } from "@/lib/study-groups/live-session-types";
import { cn } from "@/lib/utils";

const ACTIVITIES = [
	{ value: "Studying", label: "Studying" },
	{ value: "Reviewing", label: "Reviewing" },
	{ value: "Taking Quiz", label: "Taking Quiz" },
	{ value: "Done", label: "Done" },
];

function ParticipantAvatar({
	participant,
}: {
	participant: LiveSessionParticipant;
}) {
	const initial = (participant.userName ?? "?")[0]?.toUpperCase() ?? "?";
	return (
		<div
			className="flex items-center gap-1.5"
			title={participant.userName ?? "Anonymous"}
		>
			<Avatar className="size-7 border-2 border-green-400/50">
				<AvatarFallback className="bg-green-500/10 text-[10px] text-green-600">
					{initial}
				</AvatarFallback>
			</Avatar>
			{participant.currentActivity && (
				<span className="max-w-[100px] truncate text-[10px] text-foreground/50">
					{participant.currentActivity}
				</span>
			)}
		</div>
	);
}

function ParticipantAvatars({
	participants,
}: {
	participants: LiveSessionParticipant[];
}) {
	const visible = participants.slice(0, 5);
	const remainder = participants.length - visible.length;
	return (
		<div className="flex items-center gap-1">
			{visible.map((p) => (
				<ParticipantAvatar key={p.$id} participant={p} />
			))}
			{remainder > 0 && (
				<span className="ml-1 text-muted-foreground/50 text-xs">
					+{remainder}
				</span>
			)}
		</div>
	);
}

interface LiveSessionBarProps {
	groupId: string;
}

export function LiveSessionBar({ groupId }: LiveSessionBarProps) {
	const { user } = useAuth();
	const { data, isLoading } = useLiveSession(groupId);
	const startSession = useStartSession(groupId);
	const endSession = useEndSession(groupId);
	const joinSession = useJoinSession(groupId, data?.session?.$id ?? "");
	const leaveSession = useLeaveSession(groupId, data?.session?.$id ?? "");
	const updateActivity = useUpdateActivity(groupId, data?.session?.$id ?? "");
	const session = data?.session ?? null;
	const participants = data?.participants ?? [];
	const isActive = session?.status === "active";
	const isOwnSession = session?.startedBy === user?.$id;
	const currentParticipant = participants.find((p) => p.userId === user?.$id);
	const isParticipant = !!currentParticipant;

	const handleToggle = () => {
		if (isActive && isOwnSession) {
			endSession.mutate(session.$id);
		} else if (!isActive) {
			startSession.mutate({});
		}
	};

	const handleJoin = () => {
		if (session) joinSession.mutate();
	};

	const handleLeave = () => {
		if (session) leaveSession.mutate();
	};

	const handleActivityChange = (value: string | null) => {
		if (value) updateActivity.mutate(value);
	};

	if (isLoading) {
		return (
			<div className="rounded-xl border border-border bg-card p-3">
				<Skeleton className="h-6 w-40 bg-muted/30" />
			</div>
		);
	}

	return (
		<div
			className={cn(
				"rounded-xl border p-3 transition-[border-color,background-color]",
				isActive
					? "border-green-400/30 bg-green-500/5"
					: "border-border bg-card",
			)}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="relative">
						<HugeiconsIcon
							icon={isActive ? UserGroupIcon : UserMultipleIcon}
							className={cn(
								"size-5",
								isActive ? "text-green-500" : "text-muted-foreground/50",
							)}
							data-icon
						/>
						{isActive && (
							<span className="absolute -end-0.5 -top-0.5 block size-2 rounded-full bg-green-500">
								<span className="absolute inset-0 animate-ping rounded-full bg-green-500" />
							</span>
						)}
					</div>
					<div>
						<p className="font-medium text-foreground text-sm">
							{isActive ? "Live Session" : "Study Session"}
						</p>
						{isActive && (
							<p className="text-muted-foreground/60 text-xs">
								{participants.length}{" "}
								{participants.length === 1 ? "participant" : "participants"}
							</p>
						)}
					</div>
					{isActive && participants.length > 0 && (
						<ParticipantAvatars participants={participants} />
					)}
				</div>

				<div className="flex items-center gap-2">
					{isActive && !isOwnSession && (
						<span className="text-muted-foreground/50 text-xs">
							Started by {session.startedByName ?? "someone"}
						</span>
					)}
					<AnimatePresence mode="wait">
						{isActive ? (
							isOwnSession ? (
								<m.div
									key="end"
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
								>
									<Button
										variant="outline"
										size="sm"
										onClick={handleToggle}
										disabled={endSession.isPending}
										className="h-8 gap-1.5 rounded-lg border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
									>
										<HugeiconsIcon
											icon={Logout01Icon}
											className="size-3.5"
											data-icon
										/>
										End
									</Button>
								</m.div>
							) : isParticipant ? (
								<m.div
									key="participant"
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									className="flex items-center gap-2"
								>
									<Select
										value={currentParticipant?.currentActivity ?? "Studying"}
										onValueChange={handleActivityChange}
									>
										<SelectTrigger className="h-8 w-[130px] rounded-lg px-2 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{ACTIVITIES.map((a) => (
												<SelectItem key={a.value} value={a.value}>
													{a.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										variant="outline"
										size="sm"
										onClick={handleLeave}
										disabled={leaveSession.isPending}
										className="h-8 gap-1.5 rounded-lg text-xs"
									>
										<HugeiconsIcon
											icon={Logout01Icon}
											className="size-3.5"
											data-icon
										/>
										Leave
									</Button>
								</m.div>
							) : (
								<m.div
									key="join"
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
								>
									<Button
										variant="default"
										size="sm"
										onClick={handleJoin}
										disabled={joinSession.isPending}
										className="h-8 gap-1.5 rounded-lg text-xs"
									>
										<HugeiconsIcon
											icon={UserGroupIcon}
											className="size-3.5"
											data-icon
										/>
										Join Session
									</Button>
								</m.div>
							)
						) : (
							<m.div
								key="start"
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
							>
								<Button
									variant="default"
									size="sm"
									onClick={handleToggle}
									disabled={startSession.isPending}
									className="h-8 gap-1.5 rounded-lg text-xs"
								>
									<HugeiconsIcon
										icon={PlayIcon}
										className="size-3.5"
										data-icon
									/>
									Start Live
								</Button>
							</m.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}
