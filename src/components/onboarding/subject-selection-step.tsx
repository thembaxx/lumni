"use client";

import { ArrowDownIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { iOSEase } from "@/lib/utils/animation";
import { SubjectCard } from "./subject-card";

interface Subject {
	id: string;
	name: string;
	color: string;
	category?: string;
}

interface SubjectSelectionStepProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	expandedCategories: Record<string, boolean>;
	onToggleCategory: (cat: string) => void;
	selectedSubjects: string[];
	onToggleSubject: (id: string) => void;
	filteredSubjects: Subject[] | null;
	subjectsByCategory: Record<string, Subject[]>;
	categoryOrder: string[];
	categoryLabels: Record<string, string>;
}

export function SubjectSelectionStep({
	searchTerm,
	onSearchChange,
	expandedCategories,
	onToggleCategory,
	selectedSubjects,
	onToggleSubject,
	filteredSubjects,
	subjectsByCategory,
	categoryOrder,
	categoryLabels,
}: SubjectSelectionStepProps) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<>
			<div className="mb-4">
				<input
					type="text"
					value={searchTerm}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Search subjects…"
					className="w-full rounded-lg border border-bg-muted/50 bg-card/50 px-3 py-2 text-base focus:border-[--system-accent]/50 focus:outline-none"
					aria-label="Search subjects"
				/>
			</div>

			<m.div
				initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					duration: 0.3,
					delay: 0.15,
					ease: iOSEase,
				}}
				className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1"
			>
				{searchTerm ? (
					filteredSubjects && filteredSubjects.length === 0 ? (
						<p className="py-4 text-center text-muted-foreground text-xs italic">
							No subjects match &quot;{searchTerm}&quot;. Try a different
							search.
						</p>
					) : (
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{filteredSubjects?.map((subject) => (
								<SubjectCard
									key={subject.id}
									subject={subject}
									selected={selectedSubjects.includes(subject.id)}
									onToggle={() => onToggleSubject(subject.id)}
								/>
							))}
						</div>
					)
				) : (
					categoryOrder.flatMap((cat) =>
						subjectsByCategory[cat]
							? [
									(() => {
										const subjects = subjectsByCategory[cat];
										const selectedCount = subjects.filter((s) =>
											selectedSubjects.includes(s.id),
										).length;
										const isExpanded = expandedCategories[cat];
										return (
											<div
												key={cat}
												className="rounded-xl border border-border/40 bg-card/30"
											>
												<button
													type="button"
													onClick={() => onToggleCategory(cat)}
													className="flex w-full items-center gap-2 px-4 py-3 text-left"
												>
													<HugeiconsIcon
														icon={ArrowDownIcon}
														className={`size-4 text-muted-foreground transition-transform duration-200 ${
															isExpanded ? "rotate-0" : "-rotate-90"
														}`}
													/>
													<span className="flex-1 font-semibold text-sm capitalize">
														{categoryLabels[cat] || cat}
													</span>
													<span className="text-muted-foreground text-xs">
														{selectedCount > 0
															? `${selectedCount} selected`
															: `${subjects.length} subjects`}
													</span>
												</button>
												<AnimatePresence initial={false}>
													{isExpanded && (
														<m.div
															initial={
																shouldReduceMotion
																	? {}
																	: { height: 0, opacity: 0 }
															}
															animate={{ height: "auto", opacity: 1 }}
															exit={
																shouldReduceMotion
																	? {}
																	: { height: 0, opacity: 0 }
															}
															transition={{ duration: 0.2, ease: iOSEase }}
															className="overflow-hidden"
														>
															<div className="grid grid-cols-1 gap-2 px-4 pb-3 sm:grid-cols-2">
																{subjects.map((subject) => (
																	<SubjectCard
																		key={subject.id}
																		subject={subject}
																		selected={selectedSubjects.includes(
																			subject.id,
																		)}
																		onToggle={() => onToggleSubject(subject.id)}
																	/>
																))}
															</div>
														</m.div>
													)}
												</AnimatePresence>
											</div>
										);
									})(),
								]
							: [],
					)
				)}
			</m.div>
		</>
	);
}
