"use client";

import {
	BookOpen,
	Calendar,
	Check,
	ChevronLeft,
	ChevronRight,
	Clock,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { StudySession as StudySessionType, ExamDate as ExamDateType } from "@/lib/utils/study-planner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudyPlanner } from "@/hooks/use-study-planner";

export function StudyPlanner() {
	const {
		todaySessions,
		upcomingSessions,
		upcomingExams,
		stats,
		addSession,
		markComplete,
		removeSession,
		addExam,
		removeExam,
	} = useStudyPlanner();

	const [showAddSession, setShowAddSession] = useState(false);
	const [showAddExam, setShowAddExam] = useState(false);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Study Planner</h2>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddSession(true)}
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Session
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddExam(true)}
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Exam
					</Button>
				</div>
			</div>

			<StatsRow stats={stats} />

			<div className="grid md:grid-cols-2 gap-6">
				<TodaySessionsCard
					sessions={todaySessions}
					onComplete={markComplete}
					onDelete={removeSession}
				/>

				<UpcomingExamsCard exams={upcomingExams} onDelete={removeExam} />
			</div>

			<UpcomingSessionsCard
				sessions={upcomingSessions}
				onComplete={markComplete}
				onDelete={removeSession}
			/>

			{showAddSession && (
				<AddSessionModal
					onClose={() => setShowAddSession(false)}
					onAdd={(session) => {
						addSession(session);
						setShowAddSession(false);
					}}
				/>
			)}

			{showAddExam && (
				<AddExamModal
					onClose={() => setShowAddExam(false)}
					onAdd={(exam) => {
						addExam(exam);
						setShowAddExam(false);
					}}
				/>
			)}
		</div>
	);
}

function StatsRow({
	stats,
}: {
	stats: {
		completedSessions: number;
		upcomingSessions: number;
		studyTimeMinutes: number;
		examCount: number;
		daysUntilNextExam: number | null;
	};
}) {
	return (
		<div className="grid grid-cols-4 gap-4">
			<Card>
				<CardContent className="p-4 text-center">
					<div className="text-2xl font-bold">{stats.completedSessions}</div>
					<div className="text-xs text-muted-foreground">Completed</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="p-4 text-center">
					<div className="text-2xl font-bold">{stats.upcomingSessions}</div>
					<div className="text-xs text-muted-foreground">Upcoming</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="p-4 text-center">
					<div className="text-2xl font-bold">
						{Math.round(stats.studyTimeMinutes / 60)}h
					</div>
					<div className="text-xs text-muted-foreground">Study Time</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="p-4 text-center">
					<div className="text-2xl font-bold">
						{stats.daysUntilNextExam !== null ? stats.daysUntilNextExam : "-"}
					</div>
					<div className="text-xs text-muted-foreground">Days to Exam</div>
				</CardContent>
			</Card>
		</div>
	);
}

function TodaySessionsCard({
	sessions,
	onComplete,
	onDelete,
}: {
	sessions: StudySessionType[];
	onComplete: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base flex items-center gap-2">
					<Calendar className="h-4 w-4" />
					Today
				</CardTitle>
			</CardHeader>
			<CardContent>
				{sessions.length === 0 ? (
					<p className="text-sm text-muted-foreground py-4 text-center">
						No sessions scheduled for today
					</p>
				) : (
					<div className="space-y-2">
						{sessions.map((session) => (
							<div
								key={session.id}
								className="flex items-center justify-between p-3 rounded-lg bg-muted"
							>
								<div className="flex items-center gap-3">
									<button
										onClick={() => onComplete(session.id)}
										className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
											session.completed
												? "bg-green-500 border-green-500"
												: "border-muted-foreground"
										}`}
									>
										{session.completed && (
											<Check className="h-3 w-3 text-white" />
										)}
									</button>
									<div>
										<p className="font-medium text-sm">{session.subject}</p>
										<p className="text-xs text-muted-foreground">
											{session.topic || session.type} • {session.duration}min
										</p>
									</div>
								</div>
								<button
									onClick={() => onDelete(session.id)}
									className="text-muted-foreground hover:text-red-500"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function UpcomingSessionsCard({
	sessions,
	onComplete,
	onDelete,
}: {
	sessions: StudySessionType[];
	onComplete: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	const groupedByDate = sessions.reduce<Record<string, StudySessionType[]>>((acc, session) => {
		const date = new Date(session.scheduledAt).toLocaleDateString("en", {
			weekday: "long",
			month: "short",
			day: "numeric",
		});
		if (!acc[date]) acc[date] = [];
		acc[date].push(session);
		return acc;
	}, {});

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base flex items-center gap-2">
					<Clock className="h-4 w-4" />
					Upcoming Sessions
				</CardTitle>
			</CardHeader>
			<CardContent>
				{Object.keys(groupedByDate).length === 0 ? (
					<p className="text-sm text-muted-foreground py-4 text-center">
						No upcoming sessions
					</p>
				) : (
					<div className="space-y-4">
						{Object.entries(groupedByDate).map(
							([date, daySessions]: [string, StudySessionType[]]) => (
								<div key={date}>
									<h3 className="text-sm font-medium text-muted-foreground mb-2">
										{date}
									</h3>
									<div className="space-y-2">
										{daySessions.map((session) => (
											<div
												key={session.id}
												className="flex items-center justify-between p-3 rounded-lg bg-muted"
											>
												<div className="flex items-center gap-3">
													<button
														onClick={() => onComplete(session.id)}
														className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
															session.completed
																? "bg-green-500 border-green-500"
																: "border-muted-foreground"
														}`}
													>
														{session.completed && (
															<Check className="h-3 w-3 text-white" />
														)}
													</button>
													<div>
														<p className="font-medium text-sm">
															{session.subject}
														</p>
														<p className="text-xs text-muted-foreground">
															{session.topic || session.type} •{" "}
															{session.duration}min
														</p>
													</div>
												</div>
												<button
													onClick={() => onDelete(session.id)}
													className="text-muted-foreground hover:text-red-500"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										))}
									</div>
								</div>
							),
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function UpcomingExamsCard({
	exams,
	onDelete,
}: {
	exams: ExamDateType[];
	onDelete: (id: string) => void;
}) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base flex items-center gap-2">
					<BookOpen className="h-4 w-4" />
					Upcoming Exams
				</CardTitle>
			</CardHeader>
			<CardContent>
				{exams.length === 0 ? (
					<p className="text-sm text-muted-foreground py-4 text-center">
						No exams scheduled
					</p>
				) : (
					<div className="space-y-2">
						{exams.map((exam) => (
							<div
								key={exam.id}
								className="flex items-center justify-between p-3 rounded-lg bg-muted"
							>
								<div>
									<p className="font-medium text-sm">{exam.subject}</p>
									<p className="text-xs text-muted-foreground">
										{exam.paper} • {exam.daysUntil} days left
									</p>
								</div>
								<button
									onClick={() => onDelete(exam.id)}
									className="text-muted-foreground hover:text-red-500"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function AddSessionModal({
	onClose,
	onAdd,
}: {
	onClose: () => void;
	onAdd: (session: Omit<StudySessionType, "id">) => void;
}) {
	const [subject, setSubject] = useState("");
	const [topic, setTopic] = useState("");
	const [type, setType] = useState("quiz");
	const [duration, setDuration] = useState(30);

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Add Study Session</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>Subject</Label>
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="e.g., Mathematics"
						/>
					</div>
					<div>
						<Label>Topic (optional)</Label>
						<Input
							value={topic}
							onChange={(e) => setTopic(e.target.value)}
							placeholder="e.g., Algebra"
						/>
					</div>
					<div>
						<Label>Type</Label>
						<select
							className="w-full p-2 border rounded-md"
							value={type}
							onChange={(e) => setType(e.target.value)}
						>
							<option value="quiz">Quiz</option>
							<option value="flashcard">Flashcard</option>
							<option value="exam">Exam Paper</option>
							<option value="review">Review</option>
						</select>
					</div>
					<div>
						<Label>Duration (minutes)</Label>
						<Input
							type="number"
							value={duration}
							onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
							min={5}
							max={120}
						/>
					</div>
					<div className="flex gap-2 pt-4">
						<Button variant="outline" onClick={onClose} className="flex-1">
							Cancel
						</Button>
						<Button
							onClick={() =>
								onAdd({
									subject,
									topic: topic || undefined,
									type,
									scheduledAt: Date.now() + 60 * 60 * 1000,
									duration,
									completed: false,
								})
							}
							disabled={!subject}
							className="flex-1"
						>
							Add
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function AddExamModal({
	onClose,
	onAdd,
}: {
	onClose: () => void;
	onAdd: (exam: Omit<ExamDateType, "id" | "daysUntil">) => void;
}) {
	const [subject, setSubject] = useState("");
	const [paper, setPaper] = useState("");
	const [date, setDate] = useState("");

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Add Exam Date</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>Subject</Label>
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="e.g., Mathematics"
						/>
					</div>
					<div>
						<Label>Paper</Label>
						<Input
							value={paper}
							onChange={(e) => setPaper(e.target.value)}
							placeholder="e.g., Paper 1"
						/>
					</div>
					<div>
						<Label>Date</Label>
						<Input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</div>
					<div className="flex gap-2 pt-4">
						<Button variant="outline" onClick={onClose} className="flex-1">
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (!subject || !paper || !date) return;
								onAdd({
									subject,
									paper,
									date: new Date(date).getTime(),
								});
							}}
							disabled={!subject || !paper || !date}
							className="flex-1"
						>
							Add
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
