"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import dynamic from "next/dynamic";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToolsStore } from "@/store/tools";

const skel = () => <Skeleton className="h-64 w-full rounded-lg" />;

const ScientificCalculator = dynamic(
	() =>
		import("../math/scientific-calculator").then(
			(mod) => mod.ScientificCalculator,
		),
	{ ssr: false, loading: skel },
);
const PeriodicTable = dynamic(
	() => import("../science/periodic-table").then((mod) => mod.PeriodicTable),
	{ ssr: false, loading: skel },
);
const APSCalculator = dynamic(
	() => import("../math/aps-calculator").then((mod) => mod.APSCalculator),
	{ ssr: false, loading: skel },
);
const AiSolver = dynamic(
	() => import("../communication/ai-solver").then((mod) => mod.AiSolver),
	{ ssr: false, loading: skel },
);
const NationalExamCalendar = dynamic(
	() =>
		import("../scheduling/national-exam-calendar").then(
			(mod) => mod.NationalExamCalendar,
		),
	{ ssr: false, loading: skel },
);
const ResultsSearch = dynamic(
	() =>
		import("../communication/results-search").then((mod) => mod.ResultsSearch),
	{ ssr: false, loading: skel },
);
const SmartScheduler = dynamic(
	() =>
		import("../scheduling/smart-scheduler").then((mod) => mod.SmartScheduler),
	{ ssr: false, loading: skel },
);
const FlashcardCreator = dynamic(
	() =>
		import("../flashcards/flashcard-creator").then(
			(mod) => mod.FlashcardCreator,
		),
	{ ssr: false, loading: skel },
);
const NoteCreator = dynamic(
	() => import("../notes/note-creator").then((mod) => mod.NoteCreator),
	{ ssr: false, loading: skel },
);
const StudySetCreator = dynamic(
	() =>
		import("../study-sets/study-set-creator").then(
			(mod) => mod.StudySetCreator,
		),
	{ ssr: false, loading: skel },
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
		<DialogContent
			showCloseButton={false}
			className="inset-0 m-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-system-surface p-0"
		>
			<DialogTitle className="sr-only">Tools</DialogTitle>
			<m.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
				className="flex h-full flex-col"
			>
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
						aria-label="Close"
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
						<TabsContent value="solver" className="m-0 min-h-full">
							<AiSolver cameraFocus={cameraFocus} />
						</TabsContent>
						<TabsContent value="scientific" className="m-0 min-h-full">
							<ScientificCalculator />
						</TabsContent>
						<TabsContent value="periodic" className="m-0 min-h-full">
							<PeriodicTable />
						</TabsContent>
						<TabsContent value="calculator" className="m-0 min-h-full">
							<APSCalculator />
						</TabsContent>
						<TabsContent value="calendar" className="m-0 min-h-full">
							<NationalExamCalendar />
						</TabsContent>
						<TabsContent value="results" className="m-0 min-h-full">
							<ResultsSearch />
						</TabsContent>
						<TabsContent value="scheduler" className="m-0 min-h-full">
							<SmartScheduler />
						</TabsContent>
						<TabsContent value="flashcards" className="m-0 min-h-full">
							<FlashcardCreator />
						</TabsContent>
						<TabsContent value="notes" className="m-0 min-h-full">
							<NoteCreator />
						</TabsContent>
						<TabsContent value="study-sets" className="m-0 min-h-full">
							<StudySetCreator />
						</TabsContent>
					</div>
				</Tabs>
			</m.div>
		</DialogContent>
	);
}

export function ToolsDialog({ open, onOpenChange }: ToolsDialogProps) {
	return (
		<AppErrorBoundary>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<ToolsDialogInner open={open} onOpenChange={onOpenChange} />
			</Dialog>
		</AppErrorBoundary>
	);
}
