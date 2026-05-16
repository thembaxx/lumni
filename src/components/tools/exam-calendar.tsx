"use client";

import {
	Calendar03FreeIcons,
	Cancel01FreeIcons,
	Delete02FreeIcons,
	PlusSignFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/shared";

interface Exam {
	id: string;
	subject: string;
	date: Date;
	paper: string;
}

const subjectAbbrs: Record<string, string> = {
	mathematics: "Math",
	"physical-sciences": "PhySci",
	"life-sciences": "LifeSci",
	"english-home-language": "EngHL",
	"afrikaans-home-language": "AfrHL",
	geography: "Geo",
	history: "Hist",
	accounting: "Acc",
	"business-studies": "Bus",
	economics: "Econ",
};

const subjectColors: Record<string, string> = {
	mathematics: "bg-[--system-accent]",
	"physical-sciences": "bg-success",
	"life-sciences": "bg-accent",
	"english-home-language": "bg-warning",
	"afrikaans-home-language": "bg-destructive",
	geography: "bg-info",
	history: "bg-warning",
	accounting: "bg-warning-foreground",
	"business-studies": "bg-accent",
	economics: "bg-info",
};

const commonSubjects = [
	{ id: "mathematics", name: "Mathematics" },
	{ id: "physical-sciences", name: "Physical Sciences" },
	{ id: "life-sciences", name: "Life Sciences" },
	{ id: "english-home-language", name: "English House Language" },
	{ id: "afrikaans-home-language", name: "Afrikaans House Language" },
	{ id: "geography", name: "Geography" },
	{ id: "history", name: "History" },
	{ id: "accounting", name: "Accounting" },
	{ id: "business-studies", name: "Business Studies" },
	{ id: "economics", name: "Economics" },
];

const STORAGE_KEY = "lumni-exams";

export function ExamCalendar() {
	const [exams, setExams] = useState<Exam[]>([]);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [isAddingExam, setIsAddingExam] = useState(false);
	const [newExam, setNewExam] = useState({ subject: "", paper: "Paper 1" });

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				setExams(parsed.map((e: Exam) => ({ ...e, date: new Date(e.date) })));
			} catch (e) {
				console.error("Failed to load exams:", e);
			}
		}
	}, []);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
	}, [exams]);

	const addExam = () => {
		if (!selectedDate || !newExam.subject) return;

		const exam: Exam = {
			id: Date.now().toString(),
			subject: newExam.subject,
			date: selectedDate,
			paper: newExam.paper,
		};

		setExams([...exams, exam]);
		setIsAddingExam(false);
		setNewExam({ subject: "", paper: "Paper 1" });
	};

	const deleteExam = (id: string) => {
		setExams(exams.filter((e) => e.id !== id));
	};

	const examsOnDate = selectedDate
		? exams.filter(
				(e) =>
					e.date.getDate() === selectedDate.getDate() &&
					e.date.getMonth() === selectedDate.getMonth() &&
					e.date.getFullYear() === selectedDate.getFullYear(),
			)
		: [];

	const getSubjectColor = (subjectId: string) => {
		return subjectColors[subjectId] || "bg-muted";
	};

	const getSubjectAbbr = (subjectId: string) => {
		return subjectAbbrs[subjectId] || subjectId.slice(0, 4).toUpperCase();
	};

	return (
		<div className="h-full flex flex-col overflow-y-auto">
			<div className="px-5 pt-5 pb-3">
				<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
					<HugeiconsIcon
						icon={Calendar03FreeIcons}
						className="size-5 text-[--system-accent]"
					/>
					Exam Calendar
				</h2>
				<p className="ios-subhead text-[--system-text-secondary]/50 mt-1">
					Track your exam dates and never miss a paper.
				</p>
			</div>

			<div className="px-5 sm:px-5 pb-5">
				<div className="bg-system-background-secondary rounded-2xl sm:rounded-2xl p-2">
					<Calendar
						mode="single"
						onSelect={(date) => date && setSelectedDate(date)}
						selected={selectedDate}
						className="w-full rounded-xl"
					/>
				</div>
			</div>

			<div className="px-5 pb-5">
				<div className="bg-system-background-secondary rounded-2xl py-3 pr-3 pl-6 space-y-3">
					<div className="flex items-center justify-between">
						<p className="text-sm font-semibold text-foreground">
							{selectedDate
								? `Exams on ${selectedDate.toLocaleDateString("en-ZA")}`
								: "Select a date"}
						</p>
						<Button
							size="sm"
							onClick={() => setIsAddingExam(true)}
							className="rounded-xl pr-5"
						>
							<HugeiconsIcon icon={PlusSignFreeIcons} data-icon />
							Add
						</Button>
					</div>

					{examsOnDate.length > 0 ? (
						<div className="flex flex-col gap-2">
							{examsOnDate.map((exam) => (
								<div
									key={exam.id}
									className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm"
								>
									<div className="flex items-center gap-3">
										<span
											className={cn(
												"px-2.5 py-1 rounded-lg text-xs text-white font-medium",
												getSubjectColor(exam.subject),
											)}
										>
											{getSubjectAbbr(exam.subject)}
										</span>
										<div>
											<p className="font-medium text-sm">
												{commonSubjects.find((s) => s.id === exam.subject)
													?.name || exam.subject}
											</p>
											<p className="text-xs text-muted-foreground">
												{exam.paper}
											</p>
										</div>
									</div>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => deleteExam(exam.id)}
									>
										<HugeiconsIcon icon={Delete02FreeIcons} data-icon />
									</Button>
								</div>
							))}
						</div>
					) : selectedDate ? (
						<p className="text-center text-muted-foreground text-sm py-2">
							No exams on this date
						</p>
					) : null}
				</div>
			</div>

			{exams.length > 0 && (
				<div className="px-5 pb-10">
					<div className="bg-system-background-secondary rounded-2xl p-5">
						<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
							Upcoming Exams
						</p>
						<div className="flex flex-col gap-2">
							{exams
								.filter((e) => e.date >= new Date())
								.sort((a, b) => a.date.getTime() - b.date.getTime())
								.slice(0, 5)
								.map((exam) => (
									<motion.div
										key={exam.id}
										initial={{ opacity: 0, y: 5 }}
										animate={{ opacity: 1, y: 0 }}
										className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border shadow-sm"
									>
										<span
											className={cn(
												"px-2.5 py-1 rounded-lg text-xs text-white font-medium",
												getSubjectColor(exam.subject),
											)}
										>
											{getSubjectAbbr(exam.subject)}
										</span>
										<span className="text-sm tabular-nums font-medium">
											{exam.date.toLocaleDateString("en-ZA", {
												month: "short",
												day: "numeric",
											})}
										</span>
										<span className="text-xs text-muted-foreground">
											{exam.paper}
										</span>
									</motion.div>
								))}
						</div>
					</div>
				</div>
			)}

			<AnimatePresence initial={false}>
				{isAddingExam && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4"
					>
						<div
							className="absolute inset-0 bg-[--system-background]/80 backdrop-blur-sm"
							onClick={() => setIsAddingExam(false)}
						/>
						<motion.div
							initial={{ scale: 0.95, opacity: 0, y: 10 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.95, opacity: 0, y: 10 }}
							transition={{ type: "spring", duration: 0.3, bounce: 0 }}
							className="relative bg-card rounded-2xl p-6 w-full max-w-sm shadow-level-3"
						>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setIsAddingExam(false)}
								className="absolute top-4 right-4"
							>
								<HugeiconsIcon icon={Cancel01FreeIcons} data-icon />
							</Button>

							<h3 className="text-lg font-semibold mb-4">Add Exam</h3>

							<div className="flex flex-col gap-4">
								<div>
									<Label>Subject</Label>
									<div className="grid grid-cols-2 gap-2 mt-2">
										{commonSubjects.map((subject) => (
											<Button
												key={subject.id}
												className="border border-border/80"
												size="sm"
												variant={
													newExam.subject === subject.id ? "default" : "ghost"
												}
												onClick={() =>
													setNewExam({ ...newExam, subject: subject.id })
												}
											>
												{subject.name.slice(0, 10)}
											</Button>
										))}
									</div>
								</div>

								<div>
									<Label>Paper</Label>
									<div className="flex gap-2 mt-2">
										{["Paper 1", "Paper 2", "Paper 3"].map((paper) => (
											<Button
												key={paper}
												size="sm"
												className="border border-border/80"
												variant={newExam.paper === paper ? "default" : "ghost"}
												onClick={() => setNewExam({ ...newExam, paper })}
											>
												{paper}
											</Button>
										))}
									</div>
								</div>

								<Button
									className="w-full rounded-xl"
									onClick={addExam}
									disabled={!newExam.subject}
								>
									Add Exam
								</Button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
