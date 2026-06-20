"use client";

import {
	Delete02Icon,
	PencilIcon,
	RadialIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Subject {
	id: string;
	name: string;
	code: string;
	description?: string;
	category: string;
	color?: string;
}

interface SubjectTableProps {
	subjects: Subject[];
	selectedSubjects: Set<string>;
	onToggleSubject: (id: string) => void;
	onEditSubject: (subject: Subject) => void;
	onDeleteSubject: (id: string) => void;
	isLoading: boolean;
	isDeleting: boolean;
}

export function SubjectTable({
	subjects,
	selectedSubjects,
	onToggleSubject,
	onEditSubject,
	onDeleteSubject,
	isLoading,
	isDeleting,
}: SubjectTableProps) {
	return (
		<>
			{isLoading ? (
				<div className={cn("flex", "items-center", "justify-center", "p-4")}>
					<HugeiconsIcon
						icon={RadialIcon}
						className={cn("size-4", "animate-spin", "text-muted-foreground")}
					/>
				</div>
			) : subjects.length === 0 ? (
				<div
					className={cn(
						"text-center",
						"p-4",
						"text-sm",
						"text-muted-foreground",
					)}
				>
					No subjects
				</div>
			) : (
				<AnimatePresence mode="popLayout" initial={false}>
					{subjects.map((subject, index) => (
						<m.div
							key={subject.id}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 10 }}
							transition={{ delay: index * 0.03 }}
							className={cn(
								"flex",
								"items-center",
								"justify-between",
								"p-3",
								"border-b",
								"last:border-b-0",
							)}
						>
							<label
								htmlFor={`subject-${subject.id}`}
								className={cn(
									"flex",
									"items-center",
									"gap-3",
									"flex-1",
									"min-w-0",
									"cursor-pointer",
								)}
							>
								<Checkbox
									id={`subject-${subject.id}`}
									checked={selectedSubjects.has(subject.id)}
									onCheckedChange={() => onToggleSubject(subject.id)}
								/>
								<div className={cn("flex-1", "min-w-0")}>
									<p className={cn("text-sm", "font-medium", "truncate")}>
										{subject.name}
									</p>
									<p
										className={cn(
											"text-xs",
											"text-muted-foreground",
											"truncate",
										)}
									>
										{subject.code}
									</p>
								</div>
							</label>
							<div className={cn("flex", "gap-1")}>
								<m.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onEditSubject(subject)}
										className={cn("size-8")}
										aria-label={`Edit ${subject.name}`}
									>
										<HugeiconsIcon icon={PencilIcon} className={cn("size-3")} />
									</Button>
								</m.div>
								<m.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onDeleteSubject(subject.id)}
										disabled={isDeleting}
										className={cn("size-8")}
										aria-label={`Delete ${subject.name}`}
									>
										{isDeleting ? (
											<HugeiconsIcon
												icon={RadialIcon}
												className={cn("size-3", "animate-spin")}
											/>
										) : (
											<HugeiconsIcon
												icon={Delete02Icon}
												className={cn("size-3", "text-destructive")}
											/>
										)}
									</Button>
								</m.div>
							</div>
						</m.div>
					))}
				</AnimatePresence>
			)}
		</>
	);
}
