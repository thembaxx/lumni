"use client";

import {
	ArrowRight,
	BookOpen,
	Brain,
	ChartBar,
	GraduationCap,
	Lightbulb,
	Rocket,
	Sparkle,
	Target,
	Timer,
	TrendUp,
} from "@phosphor-icons/react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import { appConfig } from "../../../app.config";

const features = [
	{
		icon: Brain,
		title: "AI-Powered Practice",
		description:
			"Adaptive questions generated for your subjects and topics. Get instant feedback and explanations.",
		gradient: "from-[--system-accent]/20 to-transparent",
	},
	{
		icon: BookOpen,
		title: "Past Exam Papers",
		description:
			"Practice with real Matric papers from 2021-2025. Timed exams or free practice mode.",
		gradient: "from-blue-500/10 to-transparent",
	},
	{
		icon: ChartBar,
		title: "Progress Tracking",
		description:
			"Track your mastery per subject and topic. See your strengths and weaknesses at a glance.",
		gradient: "from-emerald-500/10 to-transparent",
	},
	{
		icon: Lightbulb,
		title: "Smart Flashcards",
		description:
			"Spaced repetition flashcards that adapt to your learning pace. Review what you need, when you need it.",
		gradient: "from-amber-500/10 to-transparent",
	},
	{
		icon: Target,
		title: "Study Planner",
		description:
			"Personalized study schedules based on your goals and exam dates. Stay on track with daily sessions.",
		gradient: "from-rose-500/10 to-transparent",
	},
	{
		icon: Rocket,
		title: "Offline-First",
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
			"Monitor your mastery growth, earn XP, unlock achievements, and walk into exams confident.",
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
					<Link href="/" className="text-lg font-extrabold tracking-tight">
						lumni
					</Link>
					<div className="flex items-center gap-2">
						{isAuthenticated ? (
							<Link href="/dashboard">
								<Button size="sm">
									Dashboard
									<ArrowRight data-icon="inline-end" weight="bold" />
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
										<ArrowRight data-icon="inline-end" weight="bold" />
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
				<div className="absolute inset-0 bg-gradient-to-b from-[--system-accent]/5 via-transparent to-transparent pointer-events-none" />
				<div className="max-w-6xl mx-auto px-4 w-full">
					<div className="grid lg:grid-cols-2 gap-12 items-center py-20">
						<div className="flex flex-col gap-8">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, ease: iOSEase }}
							>
								<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[--system-accent]/10 text-[--system-accent] text-xs font-medium mb-4">
									<Sparkle weight="fill" className="size-3" />
									SA Matric Exam Prep
								</div>
								<h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
									Pass your Matric{" "}
									<span className="text-[--system-accent]">
										with confidence
									</span>
								</h1>
								<p className="text-lg text-muted-foreground mt-4 max-w-lg leading-relaxed">
									AI-powered quizzes, past exam papers, smart flashcards, and a
									personalized study planner — all in one place. Built for South
									African Matric students.
								</p>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.15, ease: iOSEase }}
								className="flex flex-col sm:flex-row gap-3"
							>
								{isAuthenticated ? (
									<Link href="/dashboard">
										<Button size="lg" className="w-full sm:w-auto">
											Go to Dashboard
											<ArrowRight data-icon="inline-end" weight="bold" />
										</Button>
									</Link>
								) : (
									<Link href="/auth/sign-up">
										<Button size="lg" className="w-full sm:w-auto">
											Start Learning Free
											<Rocket data-icon="inline-end" weight="fill" />
										</Button>
									</Link>
								)}
							</motion.div>

							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.6, delay: 0.3 }}
								className="flex items-center gap-6 text-sm text-muted-foreground"
							>
								<div className="flex items-center gap-2">
									<GraduationCap className="size-4" />
									<span>CAPS Curriculum</span>
								</div>
								<div className="flex items-center gap-2">
									<Timer className="size-4" />
									<span>2021-2025 Papers</span>
								</div>
								<div className="flex items-center gap-2">
									<TrendUp className="size-4" />
									<span>AI-Powered</span>
								</div>
							</motion.div>
						</div>

						{/* Hero visual */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.8, delay: 0.2, ease: iOSEase }}
							className="relative hidden lg:flex items-center justify-center"
						>
							<div className="relative w-full aspect-square max-w-md">
								<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/20 via-[--system-accent]/5 to-transparent rounded-[3rem] blur-3xl" />
								<div className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-br from-[--system-accent]/10 to-background border border-border/50 p-8 flex flex-col gap-4">
									<div className="flex items-center gap-3">
										<div className="size-10 rounded-xl bg-[--system-accent]/20 flex items-center justify-center">
											<Brain
												className="size-5 text-[--system-accent]"
												weight="fill"
											/>
										</div>
										<div>
											<p className="text-sm font-semibold">AI Quiz</p>
											<p className="text-[10px] text-muted-foreground">
												Mathematics
											</p>
										</div>
									</div>
									<div className="flex-1 rounded-xl bg-muted/30 p-4 flex flex-col gap-3">
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
							From AI-generated practice to real past papers, Lumni has every
							tool you need to prepare for Matric.
						</p>
					</motion.div>

					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{features.map((feature, i) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.05, duration: 0.4, ease: iOSEase }}
								className="relative group"
							>
								<div
									className={cn(
										"absolute inset-0 rounded-[2rem] bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
										feature.gradient,
									)}
								/>
								<div className="relative p-6 rounded-[2rem] border border-border/50 bg-background/50 backdrop-blur-sm">
									<div className="size-10 rounded-xl bg-[--system-accent]/10 flex items-center justify-center mb-4">
										<feature.icon className="size-5 text-[--system-accent]" />
									</div>
									<h3 className="text-base font-semibold mb-2">
										{feature.title}
									</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">
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
									<span className="text-2xl font-black text-[--system-accent]">
										{step.number}
									</span>
								</div>
								<h3 className="text-lg font-semibold mb-2">{step.title}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{step.description}
								</p>
								{i < steps.length - 1 && (
									<div className="hidden md:block absolute top-8 -right-4 text-muted-foreground/20">
										<ArrowRight weight="bold" className="size-6" />
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
						className="relative rounded-[2.5rem] bg-gradient-to-br from-[--system-accent]/10 via-background to-background border border-border/50 p-12 text-center overflow-hidden"
					>
						<div className="absolute top-0 right-0 size-64 bg-[--system-accent]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
						<div className="relative">
							<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
								Ready to ace your Matric?
							</h2>
							<p className="text-muted-foreground max-w-md mx-auto mb-8">
								Join thousands of South African students preparing smarter with
								Lumni.
							</p>
							{isAuthenticated ? (
								<Link href="/dashboard">
									<Button size="lg">
										Go to Dashboard
										<ArrowRight data-icon="inline-end" weight="bold" />
									</Button>
								</Link>
							) : (
								<Link href="/auth/sign-up">
									<Button size="lg">
										Start Learning Free
										<Rocket data-icon="inline-end" weight="fill" />
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
					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
						<div>
							<Link href="/" className="text-lg font-extrabold tracking-tight">
								lumni
							</Link>
							<p className="text-sm text-muted-foreground mt-2 max-w-xs">
								AI-powered Matric exam preparation for South African students.
							</p>
						</div>
						<div>
							<h4 className="text-sm font-semibold mb-3">Product</h4>
							<div className="flex flex-col gap-2 text-sm text-muted-foreground">
								<Link
									href="/quiz"
									className="hover:text-foreground transition-colors"
								>
									AI Quizzes
								</Link>
								<Link
									href="/past-papers"
									className="hover:text-foreground transition-colors"
								>
									Past Papers
								</Link>
								<Link
									href="/flashcards"
									className="hover:text-foreground transition-colors"
								>
									Flashcards
								</Link>
								<Link
									href="/study-plan"
									className="hover:text-foreground transition-colors"
								>
									Study Plan
								</Link>
							</div>
						</div>
						<div>
							<h4 className="text-sm font-semibold mb-3">Support</h4>
							<div className="flex flex-col gap-2 text-sm text-muted-foreground">
								<a
									href={appConfig.links.support}
									className="hover:text-foreground transition-colors"
								>
									Help Center
								</a>
								<a
									href={`mailto:${appConfig.contact.supportEmail}`}
									className="hover:text-foreground transition-colors"
								>
									Email Us
								</a>
								<a
									href={appConfig.links.feedback}
									className="hover:text-foreground transition-colors"
								>
									Send Feedback
								</a>
							</div>
						</div>
						<div>
							<h4 className="text-sm font-semibold mb-3">Legal</h4>
							<div className="flex flex-col gap-2 text-sm text-muted-foreground">
								<a
									href={appConfig.links.privacy}
									className="hover:text-foreground transition-colors"
								>
									Privacy Policy
								</a>
								<a
									href={appConfig.links.terms}
									className="hover:text-foreground transition-colors"
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
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								<span className="text-xs">Facebook</span>
							</a>
							<a
								href={appConfig.social.twitter}
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								<span className="text-xs">Twitter</span>
							</a>
							<a
								href={appConfig.social.instagram}
								className="text-muted-foreground hover:text-foreground transition-colors"
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
