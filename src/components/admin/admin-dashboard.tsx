"use client";

import {
	BookOpen01Icon,
	CheckmarkCircle01Icon,
	File02Icon,
	Logout01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/headers/page-header";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import { iOSEase } from "@/lib/utils/animation";
import { AdminExamList } from "./admin-exam-list";
import { AdminExamUploadZone } from "./admin-exam-upload-zone";
import { AdminStatCards } from "./admin-stat-cards";
import { SubjectForm } from "./admin-subject-form";
import { SubjectTable } from "./admin-subject-table";

interface Subject {
	id: string;
	name: string;
	code: string;
	description?: string;
	category: string;
	color?: string;
}

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
			transition={{ delay, duration: 0.3, ease: iOSEase }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export function AdminDashboard() {
	const { push } = useRouter();
	const queryClient = useQueryClient();
	const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
		new Set(),
	);
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

	const handleSignOut = () => {
		localStorage.removeItem("admin_session");
		localStorage.removeItem("admin_email");
		push("/admin");
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

	return (
		<div className="min-h-[100dvh] bg-background">
			<AnimatePresence initial={false}>
				{showSuccess && (
					<motion.div
						initial={{ opacity: 0, y: -20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -20, scale: 0.95 }}
						className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-background shadow-lg"
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: "spring", stiffness: 500, damping: 25 }}
						>
							<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
						</motion.div>
						<span className="font-medium text-sm">Success!</span>
					</motion.div>
				)}
			</AnimatePresence>

			<PageHeader
				title="Admin"
				subtitle="Manage exam papers & engine"
				rightSection={
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => push("/admin/questions")}
						>
							Questions
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => push("/admin/budget")}
						>
							Budget
						</Button>
						<Button variant="ghost" size="icon-sm" onClick={handleSignOut}>
							<HugeiconsIcon icon={Logout01Icon} className="size-4" />
						</Button>
					</div>
				}
			/>

			<div className="flex flex-col gap-4 p-4">
				<AdminStatCards
					subjectsCount={subjects.length}
					selectedCount={selectedSubjects.size}
				/>

				<AnimatedCard delay={0.1}>
					<TabSwitcher
						tabs={[
							{
								value: "exam",
								label: "Exam",
								icon: <HugeiconsIcon icon={File02Icon} className="size-4" />,
							},
							{
								value: "subjects",
								label: "Subjects",
								icon: (
									<HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
								),
							},
						]}
						value={activeTab}
						onValueChange={(v) => setActiveTab(v as "exam" | "subjects")}
						listClassName="w-full"
					>
						{activeTab === "exam" && (
							<motion.div
								{...fadeInUp}
								transition={{ duration: 0.25 }}
								className="flex flex-col gap-4"
							>
								<AnimatedCard delay={0.15}>
									<AdminExamUploadZone
										onUploadComplete={() => {
											queryClient.invalidateQueries({
												queryKey: ["admin-exams"],
											});
										}}
									/>
								</AnimatedCard>

								<AnimatedCard delay={0.2}>
									<AdminExamList />
								</AnimatedCard>
							</motion.div>
						)}

						{activeTab === "subjects" && (
							<motion.div
								{...fadeInUp}
								transition={{ duration: 0.25 }}
								className="flex flex-col gap-4"
							>
								<AnimatedCard delay={0.15}>
									<SubjectForm
										editSubject={editSubject}
										formData={newSubject}
										onFormDataChange={setNewSubject}
										onSave={handleSaveSubject}
										onCancel={() => setEditSubject(null)}
										onPreload={() => preloadMutation.mutate()}
										isSaving={saveMutation.isPending}
										isPreloading={preloadMutation.isPending}
									/>
								</AnimatedCard>

								<AnimatedCard delay={0.2}>
									<Card>
										<CardHeader>
											<CardTitle>All Subjects ({subjects.length})</CardTitle>
										</CardHeader>
										<CardContent className="p-0">
											<SubjectTable
												subjects={subjects}
												selectedSubjects={selectedSubjects}
												onToggleSubject={toggleSubject}
												onEditSubject={setEditSubject}
												onDeleteSubject={handleDeleteSubject}
												isLoading={isLoading}
												isDeleting={deleteMutation.isPending}
											/>
										</CardContent>
									</Card>
								</AnimatedCard>
							</motion.div>
						)}
					</TabSwitcher>
				</AnimatedCard>
			</div>
		</div>
	);
}
