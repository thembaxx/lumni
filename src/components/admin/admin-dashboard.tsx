"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
	BookOpen,
	Check,
	Download,
	Edit2,
	FileText,
	Loader2,
	LogOut,
	Plus,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Subject {
	id: string;
	name: string;
	code: string;
	description?: string;
	category: string;
	color?: string;
}

const YEARS = [2021, 2022, 2023, 2024, 2025];
const EXAM_TYPES = [
	{ value: "june", label: "June/July" },
	{ value: "november", label: "November" },
];

export function AdminDashboard() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
		new Set(),
	);
	const [selectedYear, setSelectedYear] = useState<number>(2025);
	const [selectedExamType, setSelectedExamType] = useState<string>("november");
	const [includeMemo, setIncludeMemo] = useState(true);
	const [editSubject, setEditSubject] = useState<Subject | null>(null);
	const [newSubject, setNewSubject] = useState({
		name: "",
		code: "",
		description: "",
		category: "general",
	});
	const [activeTab, setActiveTab] = useState<"exam" | "subjects">("exam");

	const { data: subjectsData, isLoading } = useQuery({
		queryKey: ["admin-subjects"],
		queryFn: async () => {
			const res = await fetch("/api/admin/subjects");
			if (!res.ok) throw new Error("Failed to fetch subjects");
			return res.json() as Promise<{ subjects: Subject[] }>;
		},
	});

	const subjects = subjectsData?.subjects || [];

	const saveMutation = useMutation({
		mutationFn: async (subject: {
			id?: string;
			name: string;
			code: string;
			description: string;
			category: string;
		}) => {
			const method = subject.id ? "PATCH" : "POST";
			const res = await fetch("/api/admin/subjects", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(subject),
			});
			if (!res.ok) throw new Error("Failed to save subject");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
			setEditSubject(null);
			setNewSubject({
				name: "",
				code: "",
				description: "",
				category: "general",
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`/api/admin/subjects?id=${id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete subject");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
		},
	});

	const preloadMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/admin/subjects/preload?action=preload", {
				method: "POST",
			});
			if (!res.ok) throw new Error("Failed to preload");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
		},
	});

	const downloadMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/admin/download-exam-papers", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					year: selectedYear,
					examType: selectedExamType,
					includeMemo,
					subjectIds: Array.from(selectedSubjects),
				}),
			});
			if (!res.ok) throw new Error("Failed to download");
			return res.json();
		},
	});

	const handleLogout = () => {
		localStorage.removeItem("admin_session");
		localStorage.removeItem("admin_email");
		router.push("/admin");
	};

	const handleSaveSubject = () => {
		if (!newSubject.name || !newSubject.code) {
			alert("Name and code are required");
			return;
		}
		const subject = editSubject
			? { id: editSubject.id, ...newSubject }
			: newSubject;
		saveMutation.mutate(subject);
	};

	const handleDeleteSubject = (id: string) => {
		if (!confirm("Are you sure you want to delete this subject?")) return;
		deleteMutation.mutate(id);
	};

	const toggleSubject = (subjectId: string) => {
		const newSelected = new Set(selectedSubjects);
		if (newSelected.has(subjectId)) {
			newSelected.delete(subjectId);
		} else {
			newSelected.add(subjectId);
		}
		setSelectedSubjects(newSelected);
	};

	const selectAllSubjects = () => {
		setSelectedSubjects(new Set(subjects.map((s) => s.id)));
	};

	const deselectAllSubjects = () => {
		setSelectedSubjects(new Set());
	};

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-lg font-semibold">Admin</h1>
						<p className="text-xs text-muted-foreground">Manage exam papers</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						className="text-muted-foreground"
					>
						<LogOut className="w-4 h-4" />
					</Button>
				</div>
			</header>

			<div className="p-4 space-y-4">
				<div className="grid grid-cols-2 gap-3">
					<div className="p-3 rounded-lg bg-muted/50">
						<p className="text-xs text-muted-foreground">Subjects</p>
						<p className="text-xl font-semibold tabular-nums">
							{subjects.length}
						</p>
					</div>
					<div className="p-3 rounded-lg bg-muted/50">
						<p className="text-xs text-muted-foreground">Selected</p>
						<p className="text-xl font-semibold tabular-nums">
							{selectedSubjects.size}
						</p>
					</div>
				</div>

				<div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
					<button
						onClick={() => setActiveTab("exam")}
						className={cn(
							"flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
							activeTab === "exam"
								? "bg-background shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<FileText className="w-4 h-4" />
						Exam
					</button>
					<button
						onClick={() => setActiveTab("subjects")}
						className={cn(
							"flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
							activeTab === "subjects"
								? "bg-background shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<BookOpen className="w-4 h-4" />
						Subjects
					</button>
				</div>

				<AnimatePresence mode="wait">
					{activeTab === "exam" && (
						<motion.div
							key="exam"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-4"
						>
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-base">Download Papers</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">
											Year
										</Label>
										<div className="flex flex-wrap gap-1">
											{YEARS.map((year) => (
												<button
													key={year}
													onClick={() => setSelectedYear(year)}
													className={cn(
														"px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
														selectedYear === year
															? "bg-foreground text-background"
															: "bg-muted hover:bg-muted/80",
													)}
												>
													{year}
												</button>
											))}
										</div>
									</div>

									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label className="text-xs text-muted-foreground">
												Subjects
											</Label>
											<button
												onClick={
													selectedSubjects.size === subjects.length
														? deselectAllSubjects
														: selectAllSubjects
												}
												className="text-xs text-primary hover:underline"
											>
												{selectedSubjects.size === subjects.length
													? "Deselect all"
													: "Select all"}
											</button>
										</div>
										<div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
											{isLoading ? (
												<div className="flex items-center justify-center p-4">
													<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
												</div>
											) : (
												subjects.map((subject) => (
													<label
														key={subject.id}
														className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
													>
														<Checkbox
															checked={selectedSubjects.has(subject.id)}
															onCheckedChange={() => toggleSubject(subject.id)}
														/>
														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium truncate">
																{subject.name}
															</p>
															<p className="text-xs text-muted-foreground truncate">
																{subject.code}
															</p>
														</div>
													</label>
												))
											)}
										</div>
									</div>

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">
											Exam Type
										</Label>
										<div className="flex gap-1">
											{EXAM_TYPES.map((type) => (
												<button
													key={type.value}
													onClick={() => setSelectedExamType(type.value)}
													className={cn(
														"flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
														selectedExamType === type.value
															? "bg-foreground text-background"
															: "bg-muted hover:bg-muted/80",
													)}
												>
													{type.label}
												</button>
											))}
										</div>
									</div>

									<div className="flex items-center justify-between py-2">
										<div>
											<Label className="text-sm">Include Memo</Label>
											<p className="text-xs text-muted-foreground">
												With marking guidelines
											</p>
										</div>
										<Switch
											checked={includeMemo}
											onCheckedChange={setIncludeMemo}
										/>
									</div>

									<Button
										onClick={() => downloadMutation.mutate()}
										disabled={
											downloadMutation.isPending || selectedSubjects.size === 0
										}
										className="w-full"
									>
										{downloadMutation.isPending ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Downloading...
											</>
										) : (
											<>
												<Download className="w-4 h-4 mr-2" />
												Download {selectedSubjects.size} papers
											</>
										)}
									</Button>
								</CardContent>
							</Card>
						</motion.div>
					)}

					{activeTab === "subjects" && (
						<motion.div
							key="subjects"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-4"
						>
							<Card>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<CardTitle className="text-base">
											{editSubject ? "Edit" : "Add Subject"}
										</CardTitle>
										<Button
											variant="outline"
											size="sm"
											onClick={() => preloadMutation.mutate()}
											disabled={preloadMutation.isPending}
										>
											{preloadMutation.isPending ? (
												<Loader2 className="w-3 h-3 animate-spin" />
											) : (
												<Upload className="w-3 h-3 mr-1" />
											)}
											Preload
										</Button>
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="grid grid-cols-2 gap-2">
										<div className="space-y-1">
											<Label className="text-xs">Name</Label>
											<Input
												placeholder="Accounting"
												value={editSubject?.name || newSubject.name}
												onChange={(e) =>
													editSubject
														? setEditSubject({
																...editSubject,
																name: e.target.value,
															})
														: setNewSubject({
																...newSubject,
																name: e.target.value,
															})
												}
											/>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Code</Label>
											<Input
												placeholder="accounting"
												value={editSubject?.code || newSubject.code}
												onChange={(e) =>
													editSubject
														? setEditSubject({
																...editSubject,
																code: e.target.value,
															})
														: setNewSubject({
																...newSubject,
																code: e.target.value,
															})
												}
											/>
										</div>
									</div>
									<div className="space-y-1">
										<Label className="text-xs">Description</Label>
										<Input
											placeholder="Brief description"
											value={editSubject?.description || newSubject.description}
											onChange={(e) =>
												editSubject
													? setEditSubject({
															...editSubject,
															description: e.target.value,
														})
													: setNewSubject({
															...newSubject,
															description: e.target.value,
														})
											}
										/>
									</div>
									<div className="flex gap-2">
										<Button
											onClick={handleSaveSubject}
											disabled={saveMutation.isPending}
											size="sm"
										>
											{editSubject ? "Update" : "Add"}
										</Button>
										{editSubject && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => setEditSubject(null)}
											>
												Cancel
											</Button>
										)}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-base">
										All Subjects ({subjects.length})
									</CardTitle>
								</CardHeader>
								<CardContent className="p-0">
									{isLoading ? (
										<div className="flex items-center justify-center p-4">
											<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
										</div>
									) : subjects.length === 0 ? (
										<div className="p-4 text-center text-sm text-muted-foreground">
											No subjects
										</div>
									) : (
										<div className="divide-y">
											{subjects.map((subject) => (
												<div
													key={subject.id}
													className="flex items-center justify-between p-3"
												>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium truncate">
															{subject.name}
														</p>
														<p className="text-xs text-muted-foreground">
															{subject.code}
														</p>
													</div>
													<div className="flex gap-1">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => setEditSubject(subject)}
														>
															<Edit2 className="w-3 h-3" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleDeleteSubject(subject.id)}
															disabled={deleteMutation.isPending}
														>
															<Trash2 className="w-3 h-3 text-destructive" />
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
