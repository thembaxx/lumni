"use client";

import { Atom, Briefcase, Calculator, Dna, Receipt } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { nscSubjects } from "@/lib/data/nsc-subjects";
import { cn } from "@/lib/utils";

interface SubjectSelectorProps {
	onSelect: (subject: string) => void;
	className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	calculator: Calculator,
	atom: Atom,
	dna: Dna,
	receipt: Receipt,
	briefcase: Briefcase,
};

function getSubjectIcon(iconName: string) {
	return iconMap[iconName] || Calculator;
}

export function SubjectSelector({ onSelect, className }: SubjectSelectorProps) {
	const [selected, setSelected] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);

	const handleSelect = async (subjectId: string) => {
		setSelected(subjectId);
		setIsGenerating(true);
		try {
			await onSelect(subjectId);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className={cn("space-y-4", className)}>
			<p className="text-sm text-muted-foreground text-center">
				Select a subject to begin your quiz
			</p>
			<div className="grid grid-cols-2 gap-3">
				{nscSubjects.map((subject) => {
					const Icon = getSubjectIcon(subject.icon);
					const isSelected = selected === subject.id;

					return (
						<button
							key={subject.id}
							onClick={() => handleSelect(subject.id)}
							disabled={isGenerating}
							className={cn(
								"p-4 rounded-xl border-2 text-left transition-all",
								"hover:border-primary/50 hover:bg-primary/5",
								"focus:outline-none focus:ring-2 focus:ring-primary/20",
								"disabled:opacity-50 disabled:cursor-not-allowed",
								isSelected && "border-primary bg-primary/10",
							)}
						>
							<div
								className="size-10 rounded-lg flex items-center justify-center mb-3"
								style={{ backgroundColor: subject.color + "20" }}
							>
								<Icon className="size-5" style={{ color: subject.color }} />
							</div>
							<h3 className="font-medium text-sm">{subject.name}</h3>
							<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
								{subject.description}
							</p>
						</button>
					);
				})}
			</div>
			{isGenerating && (
				<p className="text-center text-sm text-muted-foreground animate-pulse">
					Generating questions with AI...
				</p>
			)}
		</div>
	);
}
