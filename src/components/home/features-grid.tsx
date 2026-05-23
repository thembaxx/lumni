"use client";

import {
	BookOpen01Icon,
	BrainIcon,
	BulbIcon,
	ChartBar,
	GlobeIcon,
	Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

const features = [
	{
		icon: BrainIcon,
		title: "AI-Powered Practice",
		description:
			"Adaptive questions generated for your subjects and topics. Get instant feedback and explanations.",
		gradient: "from-[--system-accent]/20 to-transparent",
	},
	{
		icon: BookOpen01Icon,
		title: "Past Exam Papers",
		description:
			"Practice with real Matric papers from 2021-2025. Timed exams or free practice mode.",
		gradient: "from-blue-500/10 to-transparent",
	},
	{
		icon: ChartBar,
		title: "Progress Tracking",
		description:
			"See how you're doing per subject and topic. Spot your strengths and find what needs work at a glance.",
		gradient: "from-emerald-500/10 to-transparent",
	},
	{
		icon: BulbIcon,
		title: "Smart Flashcards",
		description:
			"Flashcards that adapt to your pace. Review what you need, when you need it, and the app remembers what to show you next.",
		gradient: "from-amber-500/10 to-transparent",
	},
	{
		icon: Target01Icon,
		title: "Study Planner",
		description:
			"Personalized study schedules based on your goals and exam dates. Stay on track with daily sessions.",
		gradient: "from-rose-500/10 to-transparent",
	},
	{
		icon: GlobeIcon,
		title: "Study Offline",
		description:
			"Study anywhere, anytime. Your progress syncs automatically when you're back online.",
		gradient: "from-violet-500/10 to-transparent",
	},
];

export function FeaturesGrid() {
	return (
		<section className="relative py-24">
			<div className="mx-auto max-w-6xl px-4">
				<m.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="mb-16 text-center"
				>
					<h2 className="ios-title-1 mb-3">
						Everything you need to ace your exams
					</h2>
					<p className="ios-body mx-auto max-w-lg text-muted-foreground">
						AI practice, real past papers, and study tools that adapt to how you
						learn. Built for the CAPS curriculum.
					</p>
				</m.div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
					{features.map((feature, i) => (
						<m.div
							key={feature.title}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: i * 0.05, duration: 0.4, ease: iOSEase }}
							className={cn(
								"group relative",
								i === 0 && "sm:col-span-2 lg:col-span-4 lg:row-span-2",
								i === 1 && "lg:col-span-2",
								i === 2 && "lg:col-span-2",
								i === 3 && "lg:col-span-2",
								i === 4 && "sm:col-span-2 lg:col-span-3",
								i === 5 && "sm:col-span-2 lg:col-span-3",
							)}
						>
							<div
								className={cn(
									"absolute inset-0 rounded-lg bg-linear-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
									feature.gradient,
								)}
							/>
							<div
								className={cn(
									"relative rounded-lg border border-border/50 bg-system-background-secondary shadow-level-1",
									i === 0 ? "h-full p-8" : "p-6",
								)}
							>
								<div className="mb-4 flex size-10 items-center justify-center rounded-md bg-(--system-accent-alpha-10)">
									<HugeiconsIcon
										icon={feature.icon}
										className="size-5 text-primary"
									/>
								</div>
								<h3 className="mb-2 font-semibold text-base sm:text-lg">
									{feature.title}
								</h3>
								<p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
									{feature.description}
								</p>
							</div>
						</m.div>
					))}
				</div>
			</div>
		</section>
	);
}
