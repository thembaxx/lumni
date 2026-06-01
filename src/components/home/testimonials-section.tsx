"use client";

import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
	{
		quote:
			"Lumni completely changed how I prepare for exams. The AI quizzes adapt to what I actually need to practice, not just random questions.",
		name: "Thandi M.",
		achievement: "78% → 92% in Mathematics",
	},
	{
		quote:
			"The study planner helped me organise my time across all 7 subjects. I finally feel in control of my revision.",
		name: "Sipho K.",
		achievement: "Accepted to UCT Engineering",
	},
	{
		quote:
			"Being able to practice past papers on my phone during taxi rides was a game changer. Every spare minute counts.",
		name: "Lerato N.",
		achievement: "3 distinctions in Sciences",
	},
];

export function TestimonialsSection() {
	return (
		<section className="py-16 md:py-20">
			<div className="mx-auto max-w-6xl px-4">
				<m.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="mb-16 text-center"
				>
					<h2 className="ios-title-1 mb-3">Trusted by Matric students</h2>
					<p className="ios-body mx-auto max-w-lg text-muted-foreground">
						Thousands of South African students use Lumni to prepare for their
						final exams.
					</p>
				</m.div>

				<div className="grid gap-6 md:grid-cols-3">
					{testimonials.map((t, i) => (
						<m.div
							key={t.name}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: i * 0.1, duration: 0.4 }}
						>
							<Card className="h-full">
								<CardContent className="flex flex-col gap-4 p-6">
									<div className="flex gap-1">
										{[0, 1, 2, 3, 4].map((si) => (
											<HugeiconsIcon
												key={`star-${si}`}
												icon={StarIcon}
												className="size-4 text-warning"
											/>
										))}
									</div>
									<p className="text-muted-foreground text-sm leading-relaxed">
										&ldquo;{t.quote}&rdquo;
									</p>
									<div className="mt-auto">
										<p className="font-semibold text-sm">{t.name}</p>
										<p className="text-muted-foreground text-xs">
											{t.achievement}
										</p>
									</div>
								</CardContent>
							</Card>
						</m.div>
					))}
				</div>
			</div>
		</section>
	);
}
