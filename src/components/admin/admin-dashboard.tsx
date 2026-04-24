"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AnimatePresence,
	domAnimation,
	LazyMotion,
	m,
	motion,
} from "framer-motion";
import {
	BookOpen,
	Check,
	Download,
	Edit2,
	FileText,
	Loader2,
	LogOut,
	type LucideIcon,
	Trash2,
	Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const springTransition = {
	type: "spring" as const,
	stiffness: 300,
	damping: 25,
};

const fadeInUp = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -8 },
};

function AnimatedCard({
	children,
	delay = 0,
	className,
}: {
	children: React.ReactNode;
	delay?: number;
	className?: string;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

function AnimatedStatCard({
	label,
	value,
	delay = 0,
}: {
	label: string;
	value: React.ReactNode;
	delay?: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
			className="p-3 rounded-lg bg-muted/50"
		>
			<p className="text-xs text-muted-foreground">{label}</p>
			<motion.p
				className="text-xl font-semibold tabular-nums"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: delay + 0.15 }}
			>
				{value}
			</motion.p>
		</motion.div>
	);
}

function AnimatedTabButton({
	children,
	active,
	onClick,
	icon: Icon,
}: {
	children: React.ReactNode;
	active: boolean;
	onClick: () => void;
	icon: LucideIcon;
}) {
	return (
		<motion.button
			onClick={onClick}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			className={cn(
				"flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
				active
					? "bg-background shadow-sm"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			<motion.div
				animate={{ scale: active ? 1.1 : 1 }}
				transition={springTransition}
			>
				<Icon className="w-4 h-4" />
			</motion.div>
			{children}
		</motion.button>
	);
}

function AnimatedYearButton({
	year,
	selected,
	onClick,
}: {
	year: number;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<motion.button
			key={year}
			onClick={onClick}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			className={cn(
				"px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
				selected
					? "bg-foreground text-background"
					: "bg-muted hover:bg-muted/80",
			)}
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: year * 0.03, ...springTransition }}
		>
			{year}
		</motion.button>
	);
}

function AnimatedCheckbox({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: () => void;
}) {
	return (
		<motion.label
			className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
		>
			<motion.div
				initial={false}
				animate={{
					backgroundColor: checked ? "var(--foreground)" : "transparent",
					borderColor: checked
						? "var(--foreground)"
						: "var(--muted-foreground)",
				}}
				className="w-4 h-4 rounded border flex items-center justify-center"
				transition={{ duration: 0.2 }}
			>
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{
						scale: checked ? 1 : 0,
						opacity: checked ? 1 : 0,
					}}
					transition={{ type: "spring", stiffness: 500, damping: 30 }}
				>
					<Check className="w-3 h-3 text-background" />
				</motion.div>
			</motion.div>
			<input
				type="checkbox"
				checked={checked}
				onChange={onChange}
				className="sr-only"
			/>
		</motion.label>
	);
}

function AnimatedSubjectRow({
	subject,
	isSelected,
	onToggle,
	index,
	onEdit,
	onDelete,
	isDeleting,
}: {
	subject: Subject;
	isSelected: boolean;
	onToggle: () => void;
	index: number;
	onEdit: () => void;
	onDelete: () => void;
	isDeleting: boolean;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -10 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: 10 }}
			transition={{ delay: index * 0.03 }}
			className="flex items-center justify-between p-3 border-b last:border-b-0"
		>
			<label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
				<motion.div
					className={cn(
						"w-4 h-4 rounded border flex items-center justify-center transition-colors",
						isSelected
							? "bg-foreground border-foreground"
							: "border-muted-foreground",
					)}
					animate={{
						scale: isSelected ? [1, 1.1, 1] : 1,
					}}
					transition={{ duration: 0.2 }}
				>
					{isSelected && (
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: "spring", stiffness: 500, damping: 25 }}
						>
							<Check className="w-3 h-3 text-background" />
						</motion.div>
					)}
				</motion.div>
				<input
					type="checkbox"
					checked={isSelected}
					onChange={onToggle}
					className="sr-only"
				/>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium truncate">{subject.name}</p>
					<p className="text-xs text-muted-foreground truncate">
						{subject.code}
					</p>
				</div>
			</label>
			<div className="flex gap-1">
				<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
					<Button
						variant="ghost"
						size="icon"
						onClick={onEdit}
						className="h-8 w-8"
					>
						<Edit2 className="w-3 h-3" />
					</Button>
				</motion.div>
				<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
					<Button
						variant="ghost"
						size="icon"
						onClick={onDelete}
						disabled={isDeleting}
						className="h-8 w-8"
					>
						{isDeleting ? (
							<Loader2 className="w-3 h-3 animate-spin" />
						) : (
							<Trash2 className="w-3 h-3 text-destructive" />
						)}
					</Button>
				</motion.div>
			</div>
		</motion.div>
	);
}

function AnimatedSwitch({
	checked,
	onChange,
	label,
	description,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
	description: string;
}) {
	return (
		<motion.label
			className="flex items-center justify-between py-2 cursor-pointer"
			whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
			transition={{ duration: 0.2 }}
		>
			<div>
				<Label className="text-sm">{label}</Label>
				<p className="text-xs text-muted-foreground">{description}</p>
			</div>
			<motion.button
				type="button"
				onClick={() => onChange(!checked)}
				whileTap={{ scale: 0.95 }}
				className={cn(
					"w-10 h-5 rounded-full transition-colors relative",
					checked ? "bg-foreground" : "bg-muted",
				)}
			>
				<motion.div
					className="absolute top-0.5 w-4 h-4 rounded-full bg-background shadow-sm"
					animate={{
						left: checked ? 20 : 4,
					}}
					transition={springTransition}
				/>
			</motion.button>
		</motion.label>
	);
}

function AnimatedActionButton({
	children,
	onClick,
	loading,
	disabled,
	variant = "default",
}: {
	children: React.ReactNode;
	onClick: () => void;
	loading?: boolean;
	disabled?: boolean;
	variant?: "default" | "outline";
}) {
	return (
		<motion.button
			onClick={onClick}
			disabled={loading || disabled}
			whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
			whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
			className={cn(
				"flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50",
				variant === "default"
					? "bg-foreground text-background"
					: "border bg-transparent",
			)}
		>
			<motion.span
				animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
				className="flex items-center justify-center gap-2"
			>
				{loading && <Loader2 className="w-3 h-3 animate-spin" />}
				{children}
			</motion.span>
		</motion.button>
	);
}

export function AdminDashboard() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
		new Set(),
	);
	const [selectedYear, setSelectedYear] = useState<number>(2025);
	const [selectedExamTypes, setSelectedExamTypes] = useState<Set<string>>(
		new Set(["june", "november"]),
	);
	const [includeMemo, setIncludeMemo] = useState(true);
	const [editSubject, setEditSubject] = useState<Subject | null>(null);
	const [newSubject, setNewSubject] = useState({
		name: "",
		code: "",
		description: "",
		category: "general",
	});
	const [activeTab, setActiveTab] = useState<"exam" | "subjects">("exam");
	const [showSuccess, setShowSuccess] = useState(false);

	const { data: subjectsData, isLoading } = useQuery({
		queryKey: ["admin-subjects"],
		queryFn: async () => {
			const res = await fetch("/api/admin/subjects");
			if (!res.ok) throw new Error("Failed to fetch subjects");
			return res.json() as Promise<{ subjects: Subject[] }>;
		},
	});

	const subjects = subjectsData?.subjects || [];

	useEffect(() => {
		if (subjects.length > 0 && selectedSubjects.size === 0) {
			setSelectedSubjects(new Set(subjects.map((s) => s.id)));
		}
	}, [subjects, selectedSubjects.size]);

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
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 2000);
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
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 2000);
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
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 2000);
		},
	});

	const downloadMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/admin/download-exam-papers", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					year: selectedYear,
					examTypes: Array.from(selectedExamTypes),
					includeMemo,
					subjectIds: Array.from(selectedSubjects),
				}),
			});
			if (!res.ok) throw new Error("Failed to download");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 2000);
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
			<AnimatePresence>
				{showSuccess && (
					<motion.div
						initial={{ opacity: 0, y: -20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -20, scale: 0.95 }}
						className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: "spring", stiffness: 500, damping: 25 }}
						>
							<Check className="w-4 h-4" />
						</motion.div>
						<span className="text-sm font-medium">Success!</span>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.header
				className="sticky top-0 z-10 bg-background border-b px-4 py-3"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
			>
				<div className="flex items-center justify-between">
					<div>
						<motion.h1
							className="text-lg font-semibold"
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.1 }}
						>
							Admin
						</motion.h1>
						<motion.p
							className="text-xs text-muted-foreground"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.15 }}
						>
							Manage exam papers
						</motion.p>
					</div>
					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleLogout}
							className="text-muted-foreground"
						>
							<LogOut className="w-4 h-4" />
						</Button>
					</motion.div>
				</div>
			</motion.header>

			<div className="p-4 space-y-4">
				<div className="grid grid-cols-2 gap-3">
					<AnimatedStatCard
						label="Subjects"
						value={subjects.length}
						delay={0}
					/>
					<AnimatedStatCard
						label="Selected"
						value={selectedSubjects.size}
						delay={0.05}
					/>
				</div>

				<AnimatedCard delay={0.1}>
					<div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
						<AnimatedTabButton
							active={activeTab === "exam"}
							onClick={() => setActiveTab("exam")}
							icon={FileText}
						>
							Exam
						</AnimatedTabButton>
						<AnimatedTabButton
							active={activeTab === "subjects"}
							onClick={() => setActiveTab("subjects")}
							icon={BookOpen}
						>
							Subjects
						</AnimatedTabButton>
					</div>
				</AnimatedCard>

				<AnimatePresence mode="wait">
					{activeTab === "exam" && (
						<motion.div
							key="exam"
							{...fadeInUp}
							transition={{ duration: 0.25 }}
							className="space-y-4"
						>
							<AnimatedCard delay={0.15}>
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-base text-foreground">
											Download Papers
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-6">
										<div className="space-y-3">
											<Label className="text-sm font-medium text-foreground">
												Year
											</Label>
											<div className="flex flex-wrap gap-1">
												{YEARS.map((year) => (
													<AnimatedYearButton
														key={year}
														year={year}
														selected={selectedYear === year}
														onClick={() => setSelectedYear(year)}
													/>
												))}
											</div>
										</div>

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<Label className="text-sm font-medium text-foreground">
													Subjects
												</Label>
												<motion.button
													onClick={
														selectedSubjects.size === subjects.length
															? deselectAllSubjects
															: selectAllSubjects
													}
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													className="text-sm font-medium text-primary hover:underline"
												>
													{selectedSubjects.size === subjects.length
														? "Deselect all"
														: "Select all"}
												</motion.button>
											</div>
											<div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
												{isLoading ? (
													<div className="flex items-center justify-center p-4">
														<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
													</div>
												) : (
													subjects.map((subject) => (
														<div
															key={subject.id}
															className="flex items-center p-3"
														>
															<AnimatedCheckbox
																checked={selectedSubjects.has(subject.id)}
																onChange={() => toggleSubject(subject.id)}
															/>
															<span>{subject.name}</span>
														</div>
													))
												)}
											</div>
										</div>

										<div className="space-y-3">
											<Label className="text-sm font-medium text-foreground">
												Exam Type
											</Label>
											<div className="flex gap-1">
												{EXAM_TYPES.map((type) => (
													<motion.button
														key={type.value}
														onClick={() => {
															const newSelected = new Set(selectedExamTypes);
															if (newSelected.has(type.value)) {
																newSelected.delete(type.value);
															} else {
																newSelected.add(type.value);
															}
															setSelectedExamTypes(newSelected);
														}}
														whileHover={{ scale: 1.02 }}
														whileTap={{ scale: 0.98 }}
														className={cn(
															"flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
															selectedExamTypes.has(type.value)
																? "bg-foreground text-background"
																: "bg-muted hover:bg-muted/80",
														)}
													>
														{type.label}
													</motion.button>
												))}
											</div>
										</div>

										<AnimatedSwitch
											checked={includeMemo}
											onChange={setIncludeMemo}
											label="Include Memo"
											description="With marking guidelines"
										/>

										<AnimatedActionButton
											onClick={() => downloadMutation.mutate()}
											loading={downloadMutation.isPending}
											disabled={
												selectedSubjects.size === 0 ||
												selectedExamTypes.size === 0
											}
										>
											<Download className="w-4 h-4 mr-2" />
											Download {selectedSubjects.size} subject
											{selectedSubjects.size !== 1 ? "s" : ""} (
											{selectedExamTypes.size} exam
											{selectedExamTypes.size !== 1 ? "s" : ""})
										</AnimatedActionButton>
									</CardContent>
								</Card>
							</AnimatedCard>
						</motion.div>
					)}

					{activeTab === "subjects" && (
						<motion.div
							key="subjects"
							{...fadeInUp}
							transition={{ duration: 0.25 }}
							className="space-y-4"
						>
							<AnimatedCard delay={0.15}>
								<Card>
									<CardHeader className="pb-3">
										<div className="flex items-center justify-between">
											<CardTitle className="text-base text-foreground">
												{editSubject ? "Edit" : "Add Subject"}
											</CardTitle>
											<AnimatedActionButton
												onClick={() => preloadMutation.mutate()}
												loading={preloadMutation.isPending}
												variant="outline"
											>
												<Upload className="w-3 h-3 mr-1" />
												Preload
											</AnimatedActionButton>
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label className="text-sm font-medium text-foreground">
													Name
												</Label>
												<motion.div whileFocus={{ scale: 1.01 }}>
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
												</motion.div>
											</div>
											<div className="space-y-2">
												<Label className="text-sm font-medium text-foreground">
													Code
												</Label>
												<motion.div whileFocus={{ scale: 1.01 }}>
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
												</motion.div>
											</div>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-medium text-foreground">
												Description
											</Label>
											<motion.div whileFocus={{ scale: 1.01 }}>
												<Input
													placeholder="Brief description"
													value={
														editSubject?.description || newSubject.description
													}
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
											</motion.div>
										</div>
										<div className="flex gap-2 pt-2">
											<AnimatedActionButton
												onClick={handleSaveSubject}
												loading={saveMutation.isPending}
											>
												{editSubject ? "Update" : "Add"}
											</AnimatedActionButton>
											{editSubject && (
												<AnimatedActionButton
													onClick={() => setEditSubject(null)}
													variant="outline"
												>
													Cancel
												</AnimatedActionButton>
											)}
										</div>
									</CardContent>
								</Card>
							</AnimatedCard>

							<AnimatedCard delay={0.2}>
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-base text-foreground">
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
											<AnimatePresence mode="popLayout">
												{subjects.map((subject, index) => (
													<AnimatedSubjectRow
														key={subject.id}
														subject={subject}
														isSelected={selectedSubjects.has(subject.id)}
														onToggle={() => toggleSubject(subject.id)}
														index={index}
														onEdit={() => setEditSubject(subject)}
														onDelete={() => handleDeleteSubject(subject.id)}
														isDeleting={deleteMutation.isPending}
													/>
												))}
											</AnimatePresence>
										)}
									</CardContent>
								</Card>
							</AnimatedCard>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
