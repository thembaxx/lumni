"use client";

import { CalendarBlank, ClockIcon, Sparkle } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/shared";

interface StudySession {
	day: string;
	subject: string;
	topic: string;
	duration: number;
	type: "new" | "review" | "practice";
}

interface SchedulerInput {
	subjects: {
		id: string;
		name: string;
		difficulty: "easy" | "medium" | "hard";
	}[];
	hoursPerDay: number;
	examDate: Date;
	startDate: Date;
}

const subjectOptions = [
	{ id: "mathematics", name: "Mathematics" },
	{ id: "physical-sciences", name: "Physical Sciences" },
	{ id: "life-sciences", name: "Life Sciences" },
	{ id: "english-home-language", name: "English HL" },
	{ id: "afrikaans-home-language", name: "Afrikaans HL" },
	{ id: "geography", name: "Geography" },
	{ id: "history", name: "History" },
	{ id: "accounting", name: "Accounting" },
	{ id: "business-studies", name: "Business Studies" },
	{ id: "economics", name: "Economics" },
];

const topicSuggestions: Record<string, string[]> = {
	mathematics: [
		"Algebra",
		"Calculus",
		"Geometry",
		"Statistics",
		"Trigonometry",
	],
	"physical-sciences": [
		"Mechanics",
		"Waves",
		"Optics",
		"Chemistry",
		"Thermodynamics",
	],
	"life-sciences": [
		"Cell Biology",
		"Genetics",
		"Evolution",
		"Ecology",
		"Human Anatomy",
	],
	"english-home-language": [
		"Literature",
		"Poetry",
		"Essay Writing",
		"Comprehension",
		"Language",
	],
};

function generateDeterministicSchedule(input: SchedulerInput): StudySession[] {
	const sessions: StudySession[] = [];
	const { subjects, hoursPerDay, examDate, startDate } = input;

	const daysUntilExam = Math.ceil(
		(examDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
	);
	const totalDays = Math.min(daysUntilExam, 30);

	const difficultyWeights = { easy: 1, medium: 1.5, hard: 2 };
	const _totalWeight = subjects.reduce(
		(sum, s) => sum + difficultyWeights[s.difficulty],
		0,
	);

	const dayNames = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	];

	for (let day = 0; day < totalDays; day++) {
		const currentDate = new Date(startDate);
		currentDate.setDate(startDate.getDate() + day);
		const dayName = dayNames[currentDate.getDay()];

		const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
		const effectiveHours = isWeekend ? hoursPerDay * 1.5 : hoursPerDay;

		let remainingMinutes = effectiveHours * 60;

		const sortedSubjects = [...subjects].sort((a, b) => {
			const aWeight =
				difficultyWeights[a.difficulty] * (Math.random() * 0.3 + 0.7);
			const bWeight =
				difficultyWeights[b.difficulty] * (Math.random() * 0.3 + 0.7);
			return bWeight - aWeight;
		});

		const topicsPerSubject: Record<string, string[]> = {};
		sortedSubjects.forEach((subj) => {
			topicsPerSubject[subj.id] = topicSuggestions[subj.id] || [
				`${subj.name} Study`,
			];
		});

		for (const subject of sortedSubjects) {
			if (remainingMinutes <= 0) break;

			const isNew = Math.random() > 0.4;
			const type = isNew ? "new" : "review";

			const topics = topicsPerSubject[subject.id];
			const topic = topics[Math.floor(Math.random() * topics.length)];

			const sessionDuration = Math.min(
				Math.floor(
					remainingMinutes /
						(subjects.length - sortedSubjects.indexOf(subject) || 1),
				),
				subject.difficulty === "hard"
					? 60
					: subject.difficulty === "medium"
						? 45
						: 30,
			);

			if (sessionDuration >= 20) {
				sessions.push({
					day: dayName,
					subject: subject.name,
					topic: topic,
					duration: sessionDuration,
					type: type,
				});
				remainingMinutes -= sessionDuration;
			}
		}

		if (remainingMinutes >= 15) {
			sessions.push({
				day: dayName,
				subject: "Break",
				topic: "Short break & refresh",
				duration: remainingMinutes,
				type: "practice",
			});
		}
	}

	return sessions.slice(0, 50);
}

export function SmartScheduler() {
	const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
	const [hoursPerDay, setHoursPerDay] = useState(2);
	const [examDate, setExamDate] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [schedule, setSchedule] = useState<StudySession[]>([]);
	const [difficultyMap, setDifficultyMap] = useState<
		Record<string, "easy" | "medium" | "hard">
	>({});

	const toggleSubject = (subjectId: string) => {
		if (selectedSubjects.includes(subjectId)) {
			setSelectedSubjects(selectedSubjects.filter((s) => s !== subjectId));
			const newMap = { ...difficultyMap };
			delete newMap[subjectId];
			setDifficultyMap(newMap);
		} else {
			setSelectedSubjects([...selectedSubjects, subjectId]);
			setDifficultyMap({ ...difficultyMap, [subjectId]: "medium" });
		}
	};

	const updateDifficulty = (
		subjectId: string,
		difficulty: "easy" | "medium" | "hard",
	) => {
		setDifficultyMap({ ...difficultyMap, [subjectId]: difficulty });
	};

	const generateSchedule = async () => {
		if (selectedSubjects.length === 0 || !examDate) return;

		setIsGenerating(true);

		await new Promise((resolve) => setTimeout(resolve, 1500));

		const input: SchedulerInput = {
			subjects: selectedSubjects.map((id) => ({
				id,
				name: subjectOptions.find((s) => s.id === id)?.name || id,
				difficulty: difficultyMap[id] || "medium",
			})),
			hoursPerDay,
			examDate: new Date(examDate),
			startDate: new Date(),
		};

		const generatedSchedule = generateDeterministicSchedule(input);
		setSchedule(generatedSchedule);
		setIsGenerating(false);
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case "new":
				return "bg-[--system-accent]/10 text-muted-foreground";
			case "review":
				return "bg-accent/20 text-accent";
			case "practice":
				return "bg-success/20 text-success";
			default:
				return "bg-muted/50 text-muted-foreground";
		}
	};

	const daysOrder = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	];
	const scheduleByDay = daysOrder.map((day) => ({
		day,
		sessions: schedule.filter((s) => s.day === day),
	}));

	return (
		<div className="h-full flex flex-col overflow-y-auto">
			<div className="px-5 pt-5 pb-3">
				<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
					<CalendarBlank className="size-5 text-[--system-accent]" />
					Smart Scheduler
				</h2>
				<p className="ios-subhead text-[--system-text-secondary] mt-1">
					Generate a personalised study plan for your exams.
				</p>
			</div>

			{schedule.length === 0 ? (
				<div className="px-5 pb-10">
					<div className="bg-system-background-secondary rounded-2xl p-5 space-y-5">
						<div>
							<Label className="text-sm mb-3 block">Select Subjects</Label>
							<div className="grid grid-cols-2 gap-2">
								{subjectOptions.map((subject) => (
									<div key={subject.id}>
										<Button
											variant={
												selectedSubjects.includes(subject.id)
													? "default"
													: "ghost"
											}
											onClick={() => toggleSubject(subject.id)}
											className="w-full"
										>
											{subject.name}
										</Button>
										{selectedSubjects.includes(subject.id) && (
											<div className="flex gap-1 mt-1.5">
												{(["easy", "medium", "hard"] as const).map((diff) => (
													<Button
														key={diff}
														size="xs"
														variant={
															difficultyMap[subject.id] === diff
																? "default"
																: "ghost"
														}
														onClick={() => updateDifficulty(subject.id, diff)}
													>
														{diff[0].toUpperCase()}
													</Button>
												))}
											</div>
										)}
									</div>
								))}
							</div>
						</div>

						<div>
							<Label className="text-sm">Study Hours Per Day</Label>
							<div className="flex gap-2 mt-2">
								{[1, 2, 3, 4, 5].map((h) => (
									<Button
										key={h}
										variant={hoursPerDay === h ? "default" : "ghost"}
										onClick={() => setHoursPerDay(h)}
									>
										{h}h
									</Button>
								))}
							</div>
						</div>

						<div>
							<Label className="text-sm">First Exam Date</Label>
							<Input
								type="date"
								value={examDate}
								onChange={(e) => setExamDate(e.target.value)}
								className="mt-2 rounded-xl"
							/>
						</div>

						<Button
							className="w-full rounded-xl"
							onClick={generateSchedule}
							disabled={
								selectedSubjects.length === 0 || !examDate || isGenerating
							}
						>
							{isGenerating ? (
								<>
									<div className="animate-spin size-4 border-2 border-current border-t-transparent rounded-full mr-2" />
									Generating...
								</>
							) : (
								<>
									<Sparkle data-icon className="mr-2" />
									Generate Schedule
								</>
							)}
						</Button>
					</div>
				</div>
			) : (
				<div className="px-5 pb-10 flex-1 overflow-y-auto">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-semibold">Your Study Plan</h3>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSchedule([])}
							className="rounded-xl"
						>
							Reset
						</Button>
					</div>

					<div className="flex flex-col gap-4">
						{scheduleByDay
							.filter((d) => d.sessions.length > 0)
							.map((day, idx) => (
								<motion.div
									key={day.day}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: idx * 0.05 }}
								>
									<h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-foreground">
										<CalendarBlank className="size-4 text-[--system-accent]" />
										{day.day}
									</h4>
									<div className="flex flex-col gap-2">
										{day.sessions.map((session, sidx) => (
											<div
												key={`${day.day}-${sidx}`}
												className={cn(
													"p-3 rounded-xl border border-border bg-card shadow-sm",
													session.subject === "Break" && "bg-muted/50",
												)}
											>
												<div className="flex items-center justify-between">
													<div>
														<span className="font-medium text-sm">
															{session.subject}
														</span>
														<span className="text-muted-foreground text-sm ml-2">
															- {session.topic}
														</span>
													</div>
													<div className="flex items-center gap-2">
														<span
															className={cn(
																"px-2.5 py-0.5 rounded-lg text-[10px] capitalize",
																getTypeColor(session.type),
															)}
														>
															{session.type}
														</span>
														<span className="text-sm text-muted-foreground flex items-center gap-1 tabular-nums">
															<ClockIcon className="size-3" />
															{session.duration}min
														</span>
													</div>
												</div>
											</div>
										))}
									</div>
								</motion.div>
							))}
					</div>
				</div>
			)}
		</div>
	);
}
