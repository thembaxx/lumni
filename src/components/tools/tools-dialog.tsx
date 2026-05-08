"use client";

import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const PeriodicTable = dynamic(
	() => import("./periodic-table").then((mod) => mod.PeriodicTable),
	{ ssr: false },
);
const APSCalculator = dynamic(
	() => import("./aps-calculator").then((mod) => mod.APSCalculator),
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

interface ToolsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const tabs = [
	{ id: "periodic", label: "Periodic" },
	{ id: "calculator", label: "APS Calc" },
	{ id: "calendar", label: "Exams" },
	{ id: "results", label: "Results" },
	{ id: "scheduler", label: "Scheduler" },
];

export function ToolsDialog({ open, onOpenChange }: ToolsDialogProps) {
	const [activeTab, setActiveTab] = useState("periodic");

	return (
		<AnimatePresence initial={false}>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="fixed inset-0 z-50 bg-background"
				>
					<div className="h-full flex flex-col">
						<motion.header
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1, duration: 0.3 }}
							className="flex items-center justify-between px-4 py-3 border-b"
						>
							<h1 className="text-lg font-semibold text-wrap balance">Tools</h1>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => onOpenChange(false)}
								className="active:scale-[0.96] transition-transform duration-150"
							>
								<XIcon className="w-5 h-5" />
							</Button>
						</motion.header>

						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="flex-1 flex flex-col overflow-hidden"
						>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.2, duration: 0.3 }}
							>
								<TabsList className="flex w-full overflow-x-auto px-4 py-2 gap-2 bg-transparent border-b flex-shrink-0">
									{tabs.map((tab) => (
										<TabsTrigger
											key={tab.id}
											value={tab.id}
											className={cn(
												"flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md",
												"data-[active]:bg-primary data-[active]:text-primary-foreground",
												"text-muted-foreground hover:text-foreground",
												"active:scale-[0.96] transition-transform duration-150",
											)}
										>
											{tab.label}
										</TabsTrigger>
									))}
								</TabsList>
							</motion.div>

							<div className="flex-1 overflow-y-auto">
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
							</div>
						</Tabs>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
