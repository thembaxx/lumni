"use client";

import {
	Atom,
	BookOpen,
	Briefcase,
	Calculator,
	Dna,
	Globe,
	Hammer,
	Heart,
	Landmark,
	Laptop,
	Leaf,
	Map,
	MapPin,
	Music,
	Palette,
	PenTool,
	Receipt,
	Search,
	ShoppingCart,
	TrendingUp,
	Utensils,
	Wrench,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFilteredSubjects } from "@/hooks";
import { cn } from "@/lib/shared";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";

interface SubjectSelectorProps {
	onSelect: (subject: string) => void;
	className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	book: BookOpen,
	"book-open": BookOpen,
	calculator: Calculator,
	atom: Atom,
	dna: Dna,
	plant: Leaf,
	receipt: Receipt,
	briefcase: Briefcase,
	"chart-line": TrendingUp,
	globe: Globe,
	"ancient-pyramids": Landmark,
	heart: Heart,
	laptop: Laptop,
	monitor: Laptop,
	"pen-tool": PenTool,
	hammer: Hammer,
	zap: Zap,
	wrench: Wrench,
	palette: Palette,
	"theater-masks": MapPin,
	music: Music,
	"shopping-cart": ShoppingCart,
	map: Map,
	utensils: Utensils,
	tractor: Leaf,
};

function getSubjectIcon(iconName: string) {
	return iconMap[iconName] || BookOpen;
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
		<div className={cn("flex flex-col gap-4 w-full", className)}>
			<div className="pb-2">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
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
						<Button
							key={subject.id}
							variant="ghost"
							onClick={() => handleSelect(subject.id)}
							disabled={isGenerating}
							className={cn(
								"group p-4 rounded-2xl border border-border/60 text-left flex flex-col items-start justify-start h-auto w-full",
								"hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
								"focus-visible:ring-2 focus-visible:ring-[--system-accent]/30 focus-visible:border-[--system-accent]/50",
								"disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
								isSelected &&
									"border-[--system-accent] bg-[--system-accent]/5 dark:bg-[--system-accent]/10 shadow-md shadow-[--system-accent]/10",
							)}
						>
							<div
								className="size-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
								style={{
									backgroundColor: subject.color + "15",
									boxShadow: `0 0 0 1px ${subject.color}20`,
								}}
							>
								<Icon className={cn("size-5", `text-[${subject.color}]`)} />
							</div>
							<h3 className="font-semibold text-sm text-foreground group-hover:text-foreground/90">
								{subject.name}
							</h3>
							<p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
								{subject.description}
							</p>
						</Button>
					);
				})}
			</div>
			{isGenerating && (
				<div className="flex justify-center">
					<div className="flex items-center gap-2">
						<Skeleton className="size-4 rounded-full" />
						<span className="text-sm text-muted-foreground">
							Generating questions with AI...
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
