"use client";

import * as m from "motion/react-m";
import { iOSEase } from "@/lib/utils/animation";
import { WelcomeSVG } from "./svgs/welcome-svg";

interface Subject {
	id: string;
	name: string;
	color: string;
	category?: string;
}

interface CompleteStepProps {
	selectedSubjects: string[];
	subjectsData: Subject[];
	title: string;
	body: string;
}

export function CompleteStep({
	selectedSubjects,
	subjectsData,
	title,
	body,
}: CompleteStepProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<m.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, ease: iOSEase }}
				className="mb-8 size-48"
			>
				<WelcomeSVG />
			</m.div>
			<m.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.15, ease: iOSEase }}
				className="max-w-md"
			>
				<h1 className="ios-title-1 mb-3 text-balance font-semibold tracking-tight">
					{title}
				</h1>
				<p className="ios-body mb-6 text-pretty text-muted-foreground leading-relaxed">
					{body}
				</p>

				{selectedSubjects.length > 0 && (
					<m.div
						initial="hidden"
						animate="visible"
						variants={{
							visible: {
								transition: { staggerChildren: 0.04 },
							},
						}}
						className="mb-8 flex flex-wrap justify-center gap-2"
					>
						{selectedSubjects.map((id) => {
							const sub = subjectsData.find((s) => s.id === id);
							return sub ? (
								<m.span
									key={id}
									variants={{
										hidden: { opacity: 0, scale: 0.9 },
										visible: { opacity: 1, scale: 1 },
									}}
									className="rounded-full border border-border/40 px-3 py-1 font-medium text-xs"
								>
									{sub.name}
								</m.span>
							) : null;
						})}
					</m.div>
				)}

				<p className="text-pretty text-muted-foreground text-xs">
					You can change everything later in Settings.
				</p>
			</m.div>
		</div>
	);
}
