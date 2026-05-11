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

interface ToolsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const tabs = [
	{ id: "solver", label: "Solver" },
	{ id: "periodic", label: "Periodic" },
	{ id: "calculator", label: "APS Calc" },
	{ id: "calendar", label: "Exams" },
	{ id: "results", label: "Results" },
	{ id: "scheduler", label: "Scheduler" },
];

export function ToolsDialog({ open, onOpenChange }: ToolsDialogProps) {
	const [activeTab, setActiveTab] = useState("solver");

	return (
		<AnimatePresence initial={false}>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="fixed inset-0 z-50 bg-[#ffffff] dark:bg-[#0a0a0a]"
				>
					<div className="h-full flex flex-col">
						<motion.header
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1, duration: 0.3 }}
							className="flex items-center justify-between px-5 py-4 border-b border-[#000000]/10 dark:border-[#ffffff]/10"
						>
							<h1 className="text-lg font-semibold text-wrap balance text-[#000000] dark:text-[#ffffff]">
								Tools
							</h1>
							<Button
								variant="uber_chip"
								size="pill_sm"
								onClick={() => onOpenChange(false)}
								className="active:scale-[0.97] transition-transform duration-150"
							>
								<XIcon className="w-4 h-4" />
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
								className="px-4 py-3"
							>
								<TabsList className="flex justify-start w-full overflow-x-auto px-2 py-2 gap-2 scrollbar-hide bg-transparent shrink-0">
									{tabs.map((tab) => (
										<TabsTrigger
											key={tab.id}
											value={tab.id}
											className={cn(
												"shrink-0 px-4 py-2.5 text-sm font-medium rounded-[999px]",
												"data-active:bg-[#000000] data-active:text-[#ffffff] data-active:shadow-[rgba(0,0,0,0.12)_0px_4px_16px_0px]",
												"text-[#000000] bg-[#efefef] hover:bg-[#e2e2e2] active:scale-[0.97] transition-all duration-150",
												"dark:data-active:bg-[#ffffff] dark:data-active:text-[#000000]",
												"dark:text-[#ffffff] dark:bg-[#2a2a2a] dark:hover:bg-[#3a3a3a]",
											)}
										>
											{tab.label}
										</TabsTrigger>
									))}
								</TabsList>
							</motion.div>

							<div className="grow overflow-y-auto">
								<TabsContent value="solver" className="h-full m-0">
									<AiSolver />
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
							</div>
						</Tabs>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
