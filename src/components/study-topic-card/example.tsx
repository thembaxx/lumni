import React from "react";
import { cn } from "@/lib/utils";
import { StudyTopicCard } from "./index";
import type { TopicData } from "./study-topic-card.data";

interface StudyTopicCardExampleProps {
	className?: string;
}

export default function StudyTopicCardExample({
	className,
}: StudyTopicCardExampleProps) {
	const handleLearnMore = () => {
		console.log("Learn More clicked");
	};

	const handlePractice = () => {
		console.log("Practice clicked");
	};

	return (
		<div className={cn("container mx-auto p-8 space-y-8", className)}>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<StudyTopicCard
					onLearnMore={handleLearnMore}
					onPractice={handlePractice}
				/>
			</div>
		</div>
	);
}
