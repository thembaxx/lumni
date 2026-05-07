"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { cn } from "@/lib/utils";
import { StudyTopicCard } from "./study-topic-card";
import type { TopicData } from "./study-topic-card.data";

interface StudyTopicCardExampleProps {
	className?: string;
}

export default function StudyTopicCardExample({
	className,
}: StudyTopicCardExampleProps) {
	const handleLearnMore = () => {
		// Navigate to lesson detail or expand content
	};

	return (
		<div className={cn("container mx-auto pb-8 space-y-8", className)}>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<StudyTopicCard onLearnMore={handleLearnMore} />
			</div>
		</div>
	);
}
