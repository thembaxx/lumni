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
import { m, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";

export function FeaturesGrid() {
	const t = useTranslations("home");
	const prefersReducedMotion = useReducedMotion();

	const features = [
		{
			icon: BrainIcon,
			title: t("featureAIPractice"),
			description: t("featureAIPracticeDesc"),
			accent: "before:bg-[var(--system-accent-alpha-10)]",
		},
		{
			icon: BookOpen01Icon,
			title: t("featurePastPapers"),
			description: t("featurePastPapersDesc"),
			accent: "before:bg-chart-4/10",
		},
		{
			icon: ChartBar,
			title: t("featureTracking"),
			description: t("featureTrackingDesc"),
			accent: "before:bg-chart-2/10",
		},
		{
			icon: BulbIcon,
			title: t("featureFlashcards"),
			description: t("featureFlashcardsDesc"),
			accent: "before:bg-chart-3/10",
		},
		{
			icon: Target01Icon,
			title: t("featurePlanner"),
			description: t("featurePlannerDesc"),
			accent: "before:bg-chart-5/10",
		},
		{
			icon: GlobeIcon,
			title: t("featureOffline"),
			description: t("featureOfflineDesc"),
			accent: "before:bg-chart-1/10",
		},
	];
	return (
		<section className="relative py-16 md:py-20">
			<div className="mx-auto max-w-6xl px-4">
				<m.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
					className="mb-16 text-center"
				>
					<h2 className="ios-title-1 mb-3">{t("featuresHeading")}</h2>
					<p className="ios-body mx-auto max-w-lg text-muted-foreground">
						{t("featuresSubheading")}
					</p>
				</m.div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
					{features.map((feature, i) => (
						<m.div
							key={feature.title}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={
								prefersReducedMotion
									? undefined
									: { delay: i * 0.05, duration: 0.4, ease: iOSEase }
							}
							className={cn(
								"group relative before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100",
								feature.accent,
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
									"relative rounded-lg border border-border/50 bg-system-background-secondary shadow-level-1",
									i === 0
										? "flex flex-col gap-5 p-8 lg:flex-row lg:items-center"
										: "p-6",
								)}
							>
								<div
									className={cn(
										"flex items-center justify-center rounded-md bg-(--system-accent-alpha-10)",
										i === 0
											? "mb-0 size-16 shrink-0 lg:size-20"
											: "mb-4 size-10",
									)}
								>
									<HugeiconsIcon
										icon={feature.icon}
										className={cn(
											"text-primary",
											i === 0 ? "size-8" : "size-5",
										)}
									/>
								</div>
								<div>
									<h3
										className={cn(
											"mb-2 font-semibold",
											i === 0 ? "text-xl" : "text-base sm:text-lg",
										)}
									>
										{feature.title}
									</h3>
									<p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
										{feature.description}
									</p>
								</div>
							</div>
						</m.div>
					))}
				</div>
			</div>
		</section>
	);
}
