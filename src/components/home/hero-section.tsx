"use client";

import {
	BrainIcon,
	ChartUpIcon,
	Mortarboard01Icon,
	SparklesIcon,
	Timer01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";

interface HeroSectionProps {
	isAuthenticated: boolean;
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
	const { scrollYProgress } = useScroll();
	const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
	const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.98]);

	return (
		<m.section
			style={{ opacity: heroOpacity, scale: heroScale }}
			className="relative flex min-h-[90dvh] items-center pt-14"
		>
			<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent" />
			<div className="absolute top-1/4 -left-20 size-96 animate-blob-orbit rounded-full bg-primary/10 blur-3xl" />
			<div className="mx-auto w-full max-w-6xl px-4">
				<div className="grid items-center gap-12 py-20 lg:grid-cols-2">
					<div className="flex flex-col gap-8">
						<m.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, ease: iOSEase }}
						>
							<div className="mb-4 inline-flex items-center gap-2 rounded-full bg-(--system-accent-alpha-10) px-3 py-1 font-medium text-primary text-xs">
								<HugeiconsIcon icon={SparklesIcon} className="size-3" />
								Your Matric advantage
							</div>
							<h1 className="ios-large-title leading-[1.1] sm:text-5xl lg:text-6xl">
								Pass your Matric{" "}
								<span className="text-primary">with confidence</span>
							</h1>
							<p className="mt-4 max-w-lg text-lg text-muted-foreground leading-relaxed">
								AI-powered quizzes, past exam papers, smart flashcards, and a
								personalized study planner. Everything a Matric student needs to
								prepare, all in one place.
							</p>
						</m.div>

						<m.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.1, ease: iOSEase }}
							className="flex flex-col gap-3 sm:flex-row"
						>
							{isAuthenticated ? (
								<Link href="/dashboard">
									<Button size="lg" className="w-full sm:w-auto">
										Go to Dashboard
									</Button>
								</Link>
							) : (
								<Link href="/auth/sign-up">
									<Button size="lg" className="w-full sm:w-auto">
										Start Learning Free
									</Button>
								</Link>
							)}
						</m.div>

						<m.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.4, delay: 0.2 }}
							className="flex items-center gap-6 text-muted-foreground text-sm"
						>
							<div className="flex items-center gap-2">
								<HugeiconsIcon icon={Mortarboard01Icon} className="size-4" />
								<span>CAPS aligned</span>
							</div>
							<div className="flex items-center gap-2">
								<HugeiconsIcon icon={Timer01Icon} className="size-4" />
								<span>Past papers 2021-2025</span>
							</div>
							<div className="flex items-center gap-2">
								<HugeiconsIcon icon={ChartUpIcon} className="size-4" />
								<span>AI-powered</span>
							</div>
						</m.div>
					</div>

					<m.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, delay: 0.15, ease: iOSEase }}
						className="relative hidden items-center justify-center lg:flex"
					>
						<div className="relative aspect-square w-full max-w-md">
							<div className="absolute inset-0 rounded-[3rem] bg-linear-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />
							<div className="relative flex h-full w-full flex-col gap-4 rounded-lg border border-border/50 bg-linear-to-br from-primary/10 to-background p-8 shadow-level-2">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-md bg-(--system-accent-alpha-10)">
										<HugeiconsIcon
											icon={BrainIcon}
											className="size-5 text-primary"
										/>
									</div>
									<div>
										<p className="font-semibold text-sm">AI Quiz</p>
										<p className="text-[10px] text-muted-foreground">
											Mathematics
										</p>
									</div>
								</div>
								<div className="flex flex-1 flex-col gap-3 rounded-lg bg-muted/30 p-4">
									<div className="h-2 w-3/4 rounded-full bg-muted-foreground/10" />
									<div className="h-2 w-1/2 rounded-full bg-muted-foreground/10" />
									<div className="mt-2 flex gap-2">
										<div className="size-8 rounded-lg bg-success/20" />
										<div className="size-8 rounded-lg bg-muted-foreground/10" />
										<div className="size-8 rounded-lg bg-muted-foreground/10" />
										<div className="size-8 rounded-lg bg-muted-foreground/10" />
									</div>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<div className="flex size-6 items-center justify-center rounded-full bg-success/20">
											<div className="size-2 rounded-full bg-success" />
										</div>
										<span className="font-medium text-success text-xs">
											85%
										</span>
									</div>
									<span className="text-[10px] text-muted-foreground">
										Question 4 of 10
									</span>
								</div>
							</div>
						</div>
					</m.div>
				</div>
			</div>
		</m.section>
	);
}
