"use client";

import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { m, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

export function TestimonialsSection() {
	const t = useTranslations("home");
	const prefersReducedMotion = useReducedMotion();

	const testimonials = [
		{
			quote: t("testimonial1Text"),
			name: t("testimonial1Author"),
			achievement: t("testimonial1Detail"),
		},
		{
			quote: t("testimonial2Text"),
			name: t("testimonial2Author"),
			achievement: t("testimonial2Detail"),
		},
		{
			quote: t("testimonial3Text"),
			name: t("testimonial3Author"),
			achievement: t("testimonial3Detail"),
		},
	];
	return (
		<section className="py-16 md:py-20">
			<div className="mx-auto max-w-6xl px-4">
				<m.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
					className="mb-16 text-center"
				>
					<h2 className="ios-title-1 mb-3">{t("testimonialsHeading")}</h2>
					<p className="ios-body mx-auto max-w-lg text-muted-foreground">
						{t("testimonialsSubheading")}
					</p>
				</m.div>

				<div className="grid gap-6 md:grid-cols-3">
					{testimonials.map((t, i) => (
						<m.div
							key={t.name}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={
								prefersReducedMotion
									? undefined
									: { delay: i * 0.1, duration: 0.4 }
							}
						>
							<Card className="h-full">
								<CardContent className="flex flex-col gap-4 p-6">
									<div className="flex gap-1" aria-hidden="true">
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
