"use client";

import { Plus, Trash, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
		<div className="p-4 h-full flex flex-col">
			<Calendar
				mode="single"
				onSelect={(date) => date && setSelectedDate(date)}
				selected={selectedDate}
			/>

			<div className="mt-4 flex justify-between items-center">
				<h3 className="font-semibold text-wrap balance">
					{selectedDate
						? `Exams on ${selectedDate.toLocaleDateString("en-ZA")}`
						: "Select a date"}
				</h3>
				<Button
					size="sm"
					onClick={() => setIsAddingExam(true)}
					className="rounded-lg active:scale-[0.96]"
				>
					<Plus data-icon className="mr-1" />
					Add
				</Button>
			</div>

			{examsOnDate.length > 0 ? (
				<div className="mt-3 flex flex-col gap-2">
					{examsOnDate.map((exam) => (
						<div
							key={exam.id}
							className="p-3 rounded-xl shadow-[0_2px_8px_oklch(0%_0_0_/_0.06)] overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors"
						>
							<div className="flex items-center justify-between">
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
									className="active:scale-[0.96]"
								>
									<Trash data-icon />
								</Button>
							</div>
						</div>
					))}
				</div>
			) : selectedDate ? (
				<p className="text-center text-muted-foreground mt-4">
					No exams on this date
				</p>
			) : null}

			<div className="mt-4">
				<h4 className="font-medium text-sm mb-2">Upcoming Exams</h4>
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
								className="flex items-center gap-2 p-2.5 rounded-xl bg-muted shadow-[0_2px_8px_oklch(0%_0_0_/_0.04)]"
							>
								<span
									className={cn(
										"px-2.5 py-1 rounded-lg text-xs text-white font-medium",
										getSubjectColor(exam.subject),
									)}
								>
									{getSubjectAbbr(exam.subject)}
								</span>
								<span className="text-sm tabular-nums">
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
							className="absolute inset-0 bg-black/50"
							onClick={() => setIsAddingExam(false)}
						/>
						<motion.div
							initial={{ scale: 0.95, opacity: 0, y: 10 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.95, opacity: 0, y: 10 }}
							transition={{ type: "spring", duration: 0.3, bounce: 0 }}
							className="relative bg-background rounded-2xl p-6 w-full max-w-sm shadow-[0_8px_30px_oklch(0%_0_0_/_0.12)]"
						>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setIsAddingExam(false)}
								className="absolute top-4 right-4"
							>
								<X data-icon />
							</Button>

							<h3 className="text-lg font-semibold mb-4 text-wrap balance">
								Add Exam
							</h3>

							<div className="flex flex-col gap-4">
								<div>
									<Label>Subject</Label>
									<div className="grid grid-cols-2 gap-2 mt-2">
										{commonSubjects.map((subject) => (
											<Button
												key={subject.id}
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
												variant={newExam.paper === paper ? "default" : "ghost"}
												onClick={() => setNewExam({ ...newExam, paper })}
											>
												{paper}
											</Button>
										))}
									</div>
								</div>

								<Button
									className="w-full rounded-xl active:scale-[0.96]"
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
