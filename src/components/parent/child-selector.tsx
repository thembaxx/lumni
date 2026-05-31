"use client";

import { ProfileIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/shared";

const childSelectorVariants = cva(
	"flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50",
	{
		variants: {
			size: {
				default: "p-3",
				sm: "p-2",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

interface Student {
	id: string;
	name: string;
	initials: string;
	grade: string;
}

interface ChildSelectorProps
	extends VariantProps<typeof childSelectorVariants> {
	students: Student[];
	selectedId?: string;
	onValueChange: (id: string) => void;
	className?: string;
}

export function ChildSelector({
	students,
	selectedId,
	onValueChange,
	className,
	size,
}: ChildSelectorProps) {
	const selectedStudent = students.find((c) => c.id === selectedId);

	return (
		<div className={cn(childSelectorVariants({ size }), className)}>
			<Avatar className="size-10">
				<AvatarFallback className="bg-primary font-medium text-primary-foreground text-sm">
					{selectedStudent?.initials ?? "?"}
				</AvatarFallback>
			</Avatar>
			<Select
				value={selectedId ?? ""}
				onValueChange={(value) => {
					if (value) onValueChange(value);
				}}
			>
				<SelectTrigger className="w-48 border-0 bg-transparent shadow-none focus:ring-0">
					<SelectValue placeholder="Select a student" />
				</SelectTrigger>
				<SelectContent>
					{students.map((student) => (
						<SelectItem key={student.id} value={student.id}>
							<div className="flex items-center gap-2">
								<HugeiconsIcon icon={ProfileIcon} size={16} />
								<span>{student.name}</span>
								<span className="text-muted-foreground text-xs">
									({student.grade})
								</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
