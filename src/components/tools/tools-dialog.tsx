"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToolsStore } from "@/store/tools";

const ScientificCalculator = dynamic(
	() =>
		import("./scientific-calculator").then((mod) => mod.ScientificCalculator),
	{ ssr: false },
);
const PeriodicTable = dynamic(
	() => import("./periodic-table").then((mod) => mod.PeriodicTable),
	{ ssr: false },
);
const APSCalculator = dynamic(
	() => import("./aps-calculator").then((mod) => mod.APSCalculator),
	{ ssr: false },
);
const AiSolver = dynamic(
	() => import("./ai-solver").then((mod) => mod.AiSolver),
	{ ssr: false },
);
const ExamCalendar = dynamic(
	() => import("./exam-calendar").then((mod) => mod.ExamCalendar),
	{ ssr: false },
);
const ResultsSearch = dynamic(
	() => import("./results-search").then((mod) => mod.ResultsSearch),
	{ ssr: false },
);
const SmartScheduler = dynamic(
	() => import("./smart-scheduler").then((mod) => mod.SmartScheduler),
	{ ssr: false },
);
const FlashcardCreator = dynamic(
	() =>
		import("./flashcards/flashcard-creator").then(
			(mod) => mod.FlashcardCreator,
		),
	{ ssr: false },
);
const NoteCreator = dynamic(
	() => import("./notes/note-creator").then((mod) => mod.NoteCreator),
	{ ssr: false },
);
const StudySetCreator = dynamic(
	() =>
		import("./study-sets/study-set-creator").then((mod) => mod.StudySetCreator),
	{ ssr: false },
);

interface ToolsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const tabs = [
	{ id: "solver", label: "Solver" },
	{ id: "scientific", label: "Calc" },
	{ id: "periodic", label: "Periodic" },
	{ id: "calculator", label: "APS Calc" },
	{ id: "calendar", label: "Exams" },
	{ id: "results", label: "Results" },
	{ id: "scheduler", label: "Scheduler" },
	{ id: "flashcards", label: "Flashcards" },
	{ id: "notes", label: "Notes" },
	{ id: "study-sets", label: "Study Sets" },
];

function ToolsDialogInner({ open, onOpenChange }: ToolsDialogProps) {
	const initialTab = useToolsStore((s) => s.initialTab);
	const cameraFocus = useToolsStore((s) => s.cameraFocus);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			transition={{ duration: 0.2 }}
			className="fixed inset-0 z-80 bg-system-surface"
		>
			<div className="h-full flex flex-col">
				<motion.header
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, duration: 0.3 }}
					className="flex items-center justify-between px-5 py-3 border-b border-border"
				>
					<h1 className="ios-title-3 font-semibold text-[--system-text-primary]">
						Tools
					</h1>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => onOpenChange(false)}
					>
						<HugeiconsIcon icon={Cancel01Icon} data-icon />
					</Button>
				</motion.header>

				<Tabs
					defaultValue={initialTab}
					className="flex-1 flex flex-col overflow-hidden"
				>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2, duration: 0.3 }}
						className="px-5 py-3"
					>
						<TabsList className="h-11 p-1 bg-system-background-tertiary transition-colors duration-300 rounded-lg flex justify-start w-full overflow-x-auto px-2 py-2 gap-2 scrollbar-hide shrink-0">
							{tabs.map((tab) => (
								<TabsTrigger
									key={tab.id}
									value={tab.id}
									className="shrink-0 px-4 py-2.5 text-sm font-medium rounded-md dark:data-active:bg-system-surface"
								>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</motion.div>

					<div className="grow overflow-y-auto">
						<TabsContent value="solver" className="h-full m-0">
							<AiSolver cameraFocus={cameraFocus} />
						</TabsContent>
						<TabsContent value="scientific" className="h-full m-0">
							<ScientificCalculator />
						</TabsContent>
						<TabsContent value="periodic" className="h-full m-0">
							<PeriodicTable />
						</TabsContent>
						<TabsContent value="calculator" className="h-full m-0">
							<APSCalculator />
						</TabsContent>
						<TabsContent value="calendar" className="h-full m-0">
							<ExamCalendar />
						</TabsContent>
						<TabsContent value="results" className="h-full m-0">
							<ResultsSearch />
						</TabsContent>
						<TabsContent value="scheduler" className="h-full m-0">
							<SmartScheduler />
						</TabsContent>
						<TabsContent value="flashcards" className="h-full m-0">
							<FlashcardCreator />
						</TabsContent>
						<TabsContent value="notes" className="h-full m-0">
							<NoteCreator />
						</TabsContent>
						<TabsContent value="study-sets" className="h-full m-0">
							<StudySetCreator />
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</motion.div>
	);
}

export function ToolsDialog({ open, onOpenChange }: ToolsDialogProps) {
	return (
		<AnimatePresence>
			{open && <ToolsDialogInner open={open} onOpenChange={onOpenChange} />}
		</AnimatePresence>
	);
}
