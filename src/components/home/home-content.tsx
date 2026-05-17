"use client";

import { Activity02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowRight01Icon,
	BookOpen01Icon,
	BrainIcon,
	ChartBar,
	GlobeIcon,
	Mortarboard01Icon,
	BulbIcon,
	SparklesIcon,
	Target01Icon,
	Timer01Icon,
	ChartUpIcon,
} from "@hugeicons/core-free-icons";
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
		<div className="min-h-screen bg-background overflow-x-hidden">
			{/* Navigation */}
			<nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
				<div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
					<Link
						href="/"
						className="text-lg font-extrabold tracking-tight py-2 hover:text-[--system-accent] transition-colors"
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
				className="relative min-h-[90dvh] flex items-center pt-14"
			>
				<div className="absolute inset-0 bg-linear-to-b from-[--system-accent]/5 via-transparent to-transparent pointer-events-none" />
				<div className="max-w-6xl mx-auto px-4 w-full">
					<div className="grid lg:grid-cols-2 gap-12 items-center py-20">
						<div className="flex flex-col gap-8">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, ease: iOSEase }}
							>
								<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[--system-accent]/10 text-[--system-accent] text-xs font-medium mb-4">
									<HugeiconsIcon icon={SparklesIcon} className="size-3" />
									Your Matric advantage
								</div>
								<h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
									Pass your Matric{" "}
									<span className="text-[--system-accent]">
										with confidence
									</span>
								</h1>
								<p className="text-lg text-muted-foreground mt-4 max-w-lg leading-relaxed">
									AI-powered quizzes, past exam papers, smart flashcards, and a
									personalized study planner. Everything a Matric student needs
									to prepare, all in one place.
								</p>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, delay: 0.1, ease: iOSEase }}
								className="flex flex-col sm:flex-row gap-3"
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
								className="flex items-center gap-6 text-sm text-muted-foreground"
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
							className="relative hidden lg:flex items-center justify-center"
						>
							<div className="relative w-full aspect-square max-w-md">
								<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/20 via-[--system-accent]/5 to-transparent rounded-[3rem] blur-3xl" />
								<div className="relative w-full h-full rounded-[2.5rem] bg-linear-to-br from-[--system-accent]/10 to-background border border-border/50 p-8 flex flex-col gap-4">
									<div className="flex items-center gap-3">
										<div className="size-10 rounded-lg bg-[--system-accent]/20 flex items-center justify-center">
											<HugeiconsIcon
												icon={BrainIcon}
												className="size-5 text-[--system-accent]"
											/>
										</div>
										<div>
											<p className="text-sm font-semibold">AI Quiz</p>
											<p className="text-[10px] text-muted-foreground">
												Mathematics
											</p>
										</div>
									</div>
									<div className="flex-1 rounded-lg bg-muted/30 p-4 flex flex-col gap-3">
										<div className="h-2 w-3/4 rounded-full bg-muted-foreground/10" />
										<div className="h-2 w-1/2 rounded-full bg-muted-foreground/10" />
										<div className="flex gap-2 mt-2">
											<div className="size-8 rounded-lg bg-success/20" />
											<div className="size-8 rounded-lg bg-muted-foreground/10" />
											<div className="size-8 rounded-lg bg-muted-foreground/10" />
											<div className="size-8 rounded-lg bg-muted-foreground/10" />
										</div>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1.5">
											<div className="size-6 rounded-full bg-success/20 flex items-center justify-center">
												<div className="size-2 rounded-full bg-success" />
											</div>
											<span className="text-xs text-success font-medium">
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
			<section className="py-24 relative">
				<div className="max-w-6xl mx-auto px-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
							Everything you need to ace your exams
						</h2>
						<p className="text-muted-foreground mt-3 max-w-lg mx-auto">
							AI practice, real past papers, and study tools that adapt to how
							you learn. Built for the CAPS curriculum.
						</p>
					</motion.div>

					<div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
						{features.map((feature, i) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.05, duration: 0.4, ease: iOSEase }}
								className={cn(
									"relative group",
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
										"absolute inset-0 rounded-[2rem] bg-linear-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
										feature.gradient,
									)}
								/>
								<div
									className={cn(
										"relative rounded-[2rem] border border-border/50 bg-background/50 backdrop-blur-sm",
										i === 0 ? "p-8 h-full" : "p-6",
									)}
								>
									<div className="size-10 rounded-lg bg-[--system-accent]/10 flex items-center justify-center mb-4">
										<HugeiconsIcon
											icon={feature.icon}
											className="size-5 text-[--system-accent]"
										/>
									</div>
									<h3 className="text-base sm:text-lg font-semibold mb-2">
										{feature.title}
									</h3>
									<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
										{feature.description}
									</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className="py-24 bg-muted/30">
				<div className="max-w-6xl mx-auto px-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
							How it works
						</h2>
						<p className="text-muted-foreground mt-3 max-w-lg mx-auto">
							Three simple steps to start mastering your subjects.
						</p>
					</motion.div>

					<div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
						{steps.map((step, i) => (
							<motion.div
								key={step.number}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.1, duration: 0.4, ease: iOSEase }}
								className="relative text-center"
							>
								<div className="size-16 rounded-full bg-[--system-accent]/10 flex items-center justify-center mx-auto mb-4">
									<span className="text-2xl font-black text-[--system-accent] tabular-nums">
										{step.number}
									</span>
								</div>
								<h3 className="text-lg font-semibold mb-2">{step.title}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{step.description}
								</p>
								{i < steps.length - 1 && (
									<div className="hidden md:block absolute top-8 -right-4 text-muted-foreground/20">
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
				<div className="max-w-6xl mx-auto px-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="relative rounded-[2.5rem] bg-linear-to-br from-[--system-accent]/10 via-background to-background border border-border/50 p-12 text-center overflow-hidden"
					>
						<div className="absolute top-0 right-0 size-64 bg-[--system-accent]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
						<div className="relative">
							<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
								Ready to ace your Matric?
							</h2>
							<p className="text-muted-foreground max-w-md mx-auto mb-8">
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
			<footer className="border-t border-border/50 py-12">
				<div className="max-w-6xl mx-auto px-4">
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
						<div>
							<Link
								href="/"
								className="text-lg font-extrabold tracking-tight py-1.5"
							>
								lumni
							</Link>
							<p className="text-sm text-muted-foreground mt-2 max-w-xs">
								AI-powered Matric exam preparation for South African students.
							</p>
						</div>
						<div>
							<h4 className="text-sm font-semibold mb-3">Product</h4>
							<div className="flex flex-col text-sm text-muted-foreground">
								<Link
									href="/quiz"
									className="hover:text-foreground transition-colors py-1.5"
								>
									Practice Quizzes
								</Link>
								<Link
									href="/past-papers"
									className="hover:text-foreground transition-colors py-1.5"
								>
									Past Papers
								</Link>
								<Link
									href="/flashcards"
									className="hover:text-foreground transition-colors py-1.5"
								>
									Flashcards
								</Link>
								<Link
									href="/study-plan"
									className="hover:text-foreground transition-colors py-1.5"
								>
									Study Plan
								</Link>
								<Link
									href="/solve"
									className="hover:text-foreground transition-colors py-1.5"
								>
									Homework Help
								</Link>
							</div>
						</div>
						<div>
							<h4 className="text-sm font-semibold mb-3">Support</h4>
							<div className="flex flex-col text-sm text-muted-foreground">
								<a
									href={appConfig.links.support}
									className="hover:text-foreground transition-colors py-1.5"
								>
									Help Center
								</a>
								<a
									href={`mailto:${appConfig.contact.supportEmail}`}
									className="hover:text-foreground transition-colors py-1.5"
								>
									Email Us
								</a>
								<a
									href={appConfig.links.privacy}
									className="hover:text-foreground transition-colors py-1.5"
								>
									Privacy Policy
								</a>
								<a
									href={appConfig.links.terms}
									className="hover:text-foreground transition-colors py-1.5"
								>
									Terms of Service
								</a>
							</div>
						</div>
					</div>
					<div className="border-t border-border/50 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
						<p className="text-xs text-muted-foreground">
							&copy; {new Date().getFullYear()} Lumni. All rights reserved.
						</p>
						<div className="flex items-center gap-4">
							<a
								href={appConfig.social.facebook}
								className="text-muted-foreground hover:text-foreground transition-colors py-1.5"
							>
								<span className="text-xs">Facebook</span>
							</a>
							<a
								href={appConfig.social.twitter}
								className="text-muted-foreground hover:text-foreground transition-colors py-1.5"
							>
								<span className="text-xs">Twitter</span>
							</a>
							<a
								href={appConfig.social.instagram}
								className="text-muted-foreground hover:text-foreground transition-colors py-1.5"
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
