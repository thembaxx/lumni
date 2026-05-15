"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { cn } from "@/lib/shared";
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
		<div className={cn("w-full", className)}>
			<StudyTopicCard onLearnMore={handleLearnMore} />
		</div>
	);
}
