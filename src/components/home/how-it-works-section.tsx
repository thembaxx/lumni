"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { iOSEase } from "@/lib/utils/animation";

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

export function HowItWorksSection() {
	return (
		<section className="bg-system-background-secondary py-20 md:py-28">
			<div className="mx-auto max-w-6xl px-4">
				<m.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="mb-16 text-center"
				>
					<h2 className="ios-title-1 mb-3">How it works</h2>
					<p className="ios-body mx-auto max-w-lg text-muted-foreground">
						Three simple steps to start mastering your subjects.
					</p>
				</m.div>

				<div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
					{steps.map((step, i) => (
						<m.div
							key={step.number}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: i * 0.1, duration: 0.4, ease: iOSEase }}
							className="relative text-center"
						>
							<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-(--system-accent-alpha-10)">
								<span className="font-black text-2xl text-primary tabular-nums">
									{step.number}
								</span>
							</div>
							<h3 className="mb-2 font-semibold text-lg">{step.title}</h3>
							<p className="ios-body text-muted-foreground">
								{step.description}
							</p>
							{i < steps.length - 1 && (
								<div className="absolute top-8 -right-4 hidden text-muted-foreground/20 md:block">
									<HugeiconsIcon icon={ArrowRight01Icon} className="size-6" />
								</div>
							)}
						</m.div>
					))}
				</div>
			</div>
		</section>
	);
}
