"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToolsStore } from "@/store/tools";

const ScientificCalculator = dynamic(
	() =>
		import("../math/scientific-calculator").then((mod) => mod.ScientificCalculator),
	{ ssr: false },
);
const PeriodicTable = dynamic(
	() => import("../science/periodic-table").then((mod) => mod.PeriodicTable),
	{ ssr: false },
);
const APSCalculator = dynamic(
	() => import("../math/aps-calculator").then((mod) => mod.APSCalculator),
	{ ssr: false },
);
const AiSolver = dynamic(
	() => import("../communication/ai-solver").then((mod) => mod.AiSolver),
	{ ssr: false },
);
const NationalExamCalendar = dynamic(
	() =>
		import("../scheduling/national-exam-calendar").then((mod) => mod.NationalExamCalendar),
	{ ssr: false },
);
const ResultsSearch = dynamic(
	() => import("../communication/results-search").then((mod) => mod.ResultsSearch),
	{ ssr: false },
);
const SmartScheduler = dynamic(
	() => import("../scheduling/smart-scheduler").then((mod) => mod.SmartScheduler),
	{ ssr: false },
);
const FlashcardCreator = dynamic(
	() =>
		import("../flashcards/flashcard-creator").then(
			(mod) => mod.FlashcardCreator,
		),
	{ ssr: false },
);
const NoteCreator = dynamic(
	() => import("../notes/note-creator").then((mod) => mod.NoteCreator),
	{ ssr: false },
);
const StudySetCreator = dynamic(
	() =>
		import("../study-sets/study-set-creator").then((mod) => mod.StudySetCreator),
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

function ToolsDialogInner({ open: _open, onOpenChange }: ToolsDialogProps) {
	const initialTab = useToolsStore((s) => s.initialTab);
	const cameraFocus = useToolsStore((s) => s.cameraFocus);

	return (
		<m.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			transition={{ duration: 0.2 }}
			className="fixed inset-0 z-80 bg-system-surface"
		>
			<div className="flex h-full flex-col">
				<m.header
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, duration: 0.3 }}
					className="flex items-center justify-between border-border border-b px-5 py-3"
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
				</m.header>

				<Tabs
					defaultValue={initialTab}
					className="flex flex-1 flex-col overflow-hidden"
				>
					<m.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2, duration: 0.3 }}
						className="px-5 py-3"
					>
						<TabsList className="scrollbar-hide flex h-11 w-full shrink-0 justify-start gap-2 overflow-x-auto rounded-lg bg-system-background-tertiary p-2 transition-colors duration-300">
							{tabs.map((tab) => (
								<TabsTrigger
									key={tab.id}
									value={tab.id}
									className="shrink-0 rounded-md px-4 py-2.5 font-medium text-sm dark:data-active:bg-system-surface"
								>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</m.div>

					<div className="grow overflow-y-auto">
						<TabsContent value="solver" className="m-0 h-full">
							<AiSolver cameraFocus={cameraFocus} />
						</TabsContent>
						<TabsContent value="scientific" className="m-0 h-full">
							<ScientificCalculator />
						</TabsContent>
						<TabsContent value="periodic" className="m-0 h-full">
							<PeriodicTable />
						</TabsContent>
						<TabsContent value="calculator" className="m-0 h-full">
							<APSCalculator />
						</TabsContent>
						<TabsContent value="calendar" className="m-0 h-full">
							<NationalExamCalendar />
						</TabsContent>
						<TabsContent value="results" className="m-0 h-full">
							<ResultsSearch />
						</TabsContent>
						<TabsContent value="scheduler" className="m-0 h-full">
							<SmartScheduler />
						</TabsContent>
						<TabsContent value="flashcards" className="m-0 h-full">
							<FlashcardCreator />
						</TabsContent>
						<TabsContent value="notes" className="m-0 h-full">
							<NoteCreator />
						</TabsContent>
						<TabsContent value="study-sets" className="m-0 h-full">
							<StudySetCreator />
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</m.div>
	);
}

export function ToolsDialog({ open, onOpenChange }: ToolsDialogProps) {
	return (
		<AnimatePresence initial={false}>
			{open && <ToolsDialogInner open={open} onOpenChange={onOpenChange} />}
		</AnimatePresence>
	);
}
