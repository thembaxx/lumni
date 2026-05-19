"use client";

import {
	Activity02Icon,
	ArrowRight01Icon,
	BookOpen01Icon,
	BrainIcon,
	BulbIcon,
	ChartBar,
	ChartUpIcon,
	GlobeIcon,
	Mortarboard01Icon,
	SparklesIcon,
	Target01Icon,
	Timer01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import { appConfig } from "../../../app.config";

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

const steps = [
	{
		number: "01",
		title: "Choose Your Subjects",
		description:
			"Select from all CAPS Matric subjects. Pick the ones you're taking and set your target APS.",
	},
	{
		number: "02",
		title: "Practice Smart",
		description:
			"AI quizzes, past papers, and flashcards tailored to your syllabus. Focus on your weak areas.",
	},
	{
		number: "03",
		title: "Track & Improve",
		description:
			"Track your progress, earn points for studying, unlock achievements, and walk into exams confident.",
	},
];

export function HomeContent() {
	const { user, status, authReady } = useAuth();
	const isAuthenticated =
		authReady &&
		status === "authenticated" &&
		!user?.labels?.includes("anonymous");

	const { scrollYProgress } = useScroll();
	const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
	const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.98]);

	return (
		<div className="min-h-screen overflow-x-hidden bg-background">
			{/* Navigation */}
			<nav className="fixed top-0 right-0 left-0 z-50 border-border/50 border-b bg-background/80 backdrop-blur-xl">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
					<Link
						href="/"
						className="py-2 font-extrabold text-lg tracking-tight transition-colors hover:text-[--system-accent]"
					>
						lumni
					</Link>
					<div className="flex items-center gap-2">
						{isAuthenticated ? (
							<Link href="/dashboard">
								<Button size="sm" className="flex items-center">
									<HugeiconsIcon icon={Activity02Icon} className="size-5" />
									Dashboard
								</Button>
							</Link>
						) : (
							<>
								<Link href="/auth/sign-in">
									<Button variant="ghost" size="sm">
										Sign In
									</Button>
								</Link>
								<Link href="/auth/sign-up">
									<Button size="sm">
										Get Started
										<HugeiconsIcon
											icon={ArrowRight01Icon}
											data-icon="inline-end"
										/>
									</Button>
								</Link>
							</>
						)}
					</div>
				</div>
			</nav>

			{/* Hero */}
			<motion.section
				style={{ opacity: heroOpacity, scale: heroScale }}
				className="relative flex min-h-[90dvh] items-center pt-14"
			>
				<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-[--system-accent]/5 via-transparent to-transparent" />
				<div className="mx-auto w-full max-w-6xl px-4">
					<div className="grid items-center gap-12 py-20 lg:grid-cols-2">
						<div className="flex flex-col gap-8">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, ease: iOSEase }}
							>
								<div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[--system-accent]/10 px-3 py-1 font-medium text-[--system-accent] text-xs">
									<HugeiconsIcon icon={SparklesIcon} className="size-3" />
									Your Matric advantage
								</div>
								<h1 className="font-extrabold text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
									Pass your Matric{" "}
									<span className="text-[--system-accent]">
										with confidence
									</span>
								</h1>
								<p className="mt-4 max-w-lg text-lg text-muted-foreground leading-relaxed">
									AI-powered quizzes, past exam papers, smart flashcards, and a
									personalized study planner. Everything a Matric student needs
									to prepare, all in one place.
								</p>
							</motion.div>

							<motion.div
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
							</motion.div>

							<motion.div
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
							</motion.div>
						</div>

						{/* Hero visual */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.5, delay: 0.15, ease: iOSEase }}
							className="relative hidden items-center justify-center lg:flex"
						>
							<div className="relative aspect-square w-full max-w-md">
								<div className="absolute inset-0 rounded-[3rem] bg-linear-to-br from-[--system-accent]/20 via-[--system-accent]/5 to-transparent blur-3xl" />
								<div className="relative flex h-full w-full flex-col gap-4 rounded-[2.5rem] border border-border/50 bg-linear-to-br from-[--system-accent]/10 to-background p-8">
									<div className="flex items-center gap-3">
										<div className="flex size-10 items-center justify-center rounded-lg bg-[--system-accent]/20">
											<HugeiconsIcon
												icon={BrainIcon}
												className="size-5 text-[--system-accent]"
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
						</motion.div>
					</div>
				</div>
			</motion.section>

			{/* Features */}
			<section className="relative py-24">
				<div className="mx-auto max-w-6xl px-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mb-16 text-center"
					>
						<h2 className="font-extrabold text-3xl tracking-tight sm:text-4xl">
							Everything you need to ace your exams
						</h2>
						<p className="mx-auto mt-3 max-w-lg text-muted-foreground">
							AI practice, real past papers, and study tools that adapt to how
							you learn. Built for the CAPS curriculum.
						</p>
					</motion.div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
						{features.map((feature, i) => (
							<motion.div
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
										"absolute inset-0 rounded-[2rem] bg-linear-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
										feature.gradient,
									)}
								/>
								<div
									className={cn(
										"relative rounded-[2rem] border border-border/50 bg-background/50 backdrop-blur-sm",
										i === 0 ? "h-full p-8" : "p-6",
									)}
								>
									<div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[--system-accent]/10">
										<HugeiconsIcon
											icon={feature.icon}
											className="size-5 text-[--system-accent]"
										/>
									</div>
									<h3 className="mb-2 font-semibold text-base sm:text-lg">
										{feature.title}
									</h3>
									<p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
										{feature.description}
									</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className="bg-muted/30 py-24">
				<div className="mx-auto max-w-6xl px-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mb-16 text-center"
					>
						<h2 className="font-extrabold text-3xl tracking-tight sm:text-4xl">
							How it works
						</h2>
						<p className="mx-auto mt-3 max-w-lg text-muted-foreground">
							Three simple steps to start mastering your subjects.
						</p>
					</motion.div>

					<div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
						{steps.map((step, i) => (
							<motion.div
								key={step.number}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.1, duration: 0.4, ease: iOSEase }}
								className="relative text-center"
							>
								<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[--system-accent]/10">
									<span className="font-black text-2xl text-[--system-accent] tabular-nums">
										{step.number}
									</span>
								</div>
								<h3 className="mb-2 font-semibold text-lg">{step.title}</h3>
								<p className="text-muted-foreground text-sm leading-relaxed">
									{step.description}
								</p>
								{i < steps.length - 1 && (
									<div className="absolute top-8 -right-4 hidden text-muted-foreground/20 md:block">
										<HugeiconsIcon icon={ArrowRight01Icon} className="size-6" />
									</div>
								)}
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-24">
				<div className="mx-auto max-w-6xl px-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-linear-to-br from-[--system-accent]/10 via-background to-background p-12 text-center"
					>
						<div className="absolute top-0 right-0 size-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-[--system-accent]/5 blur-3xl" />
						<div className="relative">
							<h2 className="mb-4 font-extrabold text-3xl tracking-tight sm:text-4xl">
								Ready to ace your Matric?
							</h2>
							<p className="mx-auto mb-8 max-w-md text-muted-foreground">
								Thousands of South African students trust Lumni to prepare for
								Matric. You can too.
							</p>
							{isAuthenticated ? (
								<Link href="/dashboard">
									<Button size="lg">
										Go to Dashboard
										<HugeiconsIcon
											icon={ArrowRight01Icon}
											data-icon="inline-end"
										/>
									</Button>
								</Link>
							) : (
								<Link href="/auth/sign-up">
									<Button size="lg">
										Start Learning Free
										<HugeiconsIcon
											icon={Mortarboard01Icon}
											data-icon="inline-end"
										/>
									</Button>
								</Link>
							)}
						</div>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-border/50 border-t py-12">
				<div className="mx-auto max-w-6xl px-4">
					<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
						<div>
							<Link
								href="/"
								className="py-1.5 font-extrabold text-lg tracking-tight"
							>
								lumni
							</Link>
							<p className="mt-2 max-w-xs text-muted-foreground text-sm">
								AI-powered Matric exam preparation for South African students.
							</p>
						</div>
						<div>
							<h4 className="mb-3 font-semibold text-sm">Product</h4>
							<div className="flex flex-col text-muted-foreground text-sm">
								<Link
									href="/quiz"
									className="py-1.5 transition-colors hover:text-foreground"
								>
									Practice Quizzes
								</Link>
								<Link
									href="/past-papers"
									className="py-1.5 transition-colors hover:text-foreground"
								>
									Past Papers
								</Link>
								<Link
									href="/flashcards"
									className="py-1.5 transition-colors hover:text-foreground"
								>
									Flashcards
								</Link>
								<Link
									href="/study-plan"
									className="py-1.5 transition-colors hover:text-foreground"
								>
									Study Plan
								</Link>
								<Link
									href="/solve"
									className="py-1.5 transition-colors hover:text-foreground"
								>
									Homework Help
								</Link>
							</div>
						</div>
						<div>
							<h4 className="mb-3 font-semibold text-sm">Support</h4>
							<div className="flex flex-col text-muted-foreground text-sm">
								<a
									href={appConfig.links.support}
									className="py-1.5 transition-colors hover:text-foreground"
								>
									Help Center
								</a>
								<a
									href={`mailto:${appConfig.contact.supportEmail}`}
									className="py-1.5 transition-colors hover:text-foreground"
								>
									Email Us
								</a>
								<a
									href={appConfig.links.privacy}
									className="py-1.5 transition-colors hover:text-foreground"
								>
									Privacy Policy
								</a>
								<a
									href={appConfig.links.terms}
									className="py-1.5 transition-colors hover:text-foreground"
								>
									Terms of Service
								</a>
							</div>
						</div>
					</div>
					<div className="mt-8 flex flex-col items-center justify-between gap-4 border-border/50 border-t pt-8 sm:flex-row">
						<p className="text-muted-foreground text-xs">
							&copy; {new Date().getFullYear()} Lumni. All rights reserved.
						</p>
						<div className="flex items-center gap-4">
							<a
								href={appConfig.social.facebook}
								className="py-1.5 text-muted-foreground transition-colors hover:text-foreground"
							>
								<span className="text-xs">Facebook</span>
							</a>
							<a
								href={appConfig.social.twitter}
								className="py-1.5 text-muted-foreground transition-colors hover:text-foreground"
							>
								<span className="text-xs">Twitter</span>
							</a>
							<a
								href={appConfig.social.instagram}
								className="py-1.5 text-muted-foreground transition-colors hover:text-foreground"
							>
								<span className="text-xs">Instagram</span>
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
