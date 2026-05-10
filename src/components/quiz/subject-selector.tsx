"use client";

import {
	Atom,
	Briefcase,
	Calculator,
	Dna,
	Receipt,
	Search,
} from "lucide-react";
import { useState } from "react";
import { useFilteredSubjects } from "@/hooks";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";

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
	const [searchQuery, setSearchQuery] = useState("");
	const { data: subjects } = useFilteredSubjects(searchQuery);
	const [selected, setSelected] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);

	const handleSelect = async (subjectId: string) => {
		setSelected(subjectId);
		setIsGenerating(true);
		try {
			onSelect(subjectId);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className={cn("space-y-4 w-full", className)}>
			<div className="pb-2">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
					<Input
						type="text"
						placeholder="Search subjects..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="h-10 pl-10 pr-4 rounded-lg"
					/>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-3">
				{subjects.map((subject) => {
					const Icon = getSubjectIcon(subject.icon);
					const isSelected = selected === subject.id;

					return (
						<button
							key={subject.id}
							onClick={() => handleSelect(subject.id)}
							disabled={isGenerating}
							className={cn(
								"p-4 rounded-xl border-2 text-left transition-colors transition-border-color flex flex-col items-start",
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
								<span style={{ color: subject.color }}>
									<Icon className="size-5" />
								</span>
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
