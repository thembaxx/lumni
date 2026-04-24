"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Edit2, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
						<motion.div
							key={subject.id}
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
										selectedSubjects.has(subject.id)
											? "bg-foreground border-foreground"
											: "border-muted-foreground",
									)}
									animate={{
										scale: selectedSubjects.has(subject.id) ? [1, 1.1, 1] : 1,
									}}
									transition={{ duration: 0.2 }}
								>
									{selectedSubjects.has(subject.id) && (
										<motion.div
											initial={{ scale: 0.95, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											transition={{
												type: "spring",
												stiffness: 500,
												damping: 25,
											}}
										>
											<Check className="w-3 h-3 text-background" />
										</motion.div>
									)}
								</motion.div>
								<input
									type="checkbox"
									checked={selectedSubjects.has(subject.id)}
									onChange={() => onToggleSubject(subject.id)}
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
								<motion.div
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
								>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onEditSubject(subject)}
										className="h-8 w-8"
									>
										<Edit2 className="w-3 h-3" />
									</Button>
								</motion.div>
								<motion.div
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
								>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onDeleteSubject(subject.id)}
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
					))}
				</AnimatePresence>
			)}
		</>
	);
}
