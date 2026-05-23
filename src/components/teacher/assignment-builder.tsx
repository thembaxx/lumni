"use client";

import { BookOpen01Icon, SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/shared";

interface AssignmentBuilderProps extends React.ComponentProps<typeof Card> {
	topics: string[];
	onAssign: (topics: string[], dueDate?: string) => void;
}

export function AssignmentBuilder({
	topics,
	onAssign,
	className,
	...props
}: AssignmentBuilderProps) {
	const [selected, setSelected] = useState<string[]>([]);
	const [open, setOpen] = useState(false);

	const toggleTopic = (topic: string) => {
		setSelected((prev) =>
			prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
		);
	};

	return (
		<Card className={cn(className)} {...props}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 font-heading text-base">
					<HugeiconsIcon
						icon={BookOpen01Icon}
						size={20}
						className="text-primary"
					/>
					Assignment Builder
				</CardTitle>
				<CardDescription>
					Select weak topics to assign targeted practice.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<Command className="rounded-lg border">
					<CommandInput placeholder="Search topics..." />
					<CommandList>
						<CommandEmpty>No topics found.</CommandEmpty>
						<CommandGroup>
							{topics.map((topic) => (
								<CommandItem
									key={topic}
									value={topic}
									onSelect={() => toggleTopic(topic)}
									className="cursor-pointer"
								>
									<div className="flex items-center gap-2">
										<div
											className={cn(
												"size-4 rounded-sm border",
												selected.includes(topic)
													? "border-primary bg-primary"
													: "border-muted-foreground",
											)}
										/>
										<span>{topic}</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>

				{selected.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{selected.map((topic) => (
							<Badge
								key={topic}
								variant="secondary"
								className="cursor-pointer"
								onClick={() => toggleTopic(topic)}
							>
								{topic} ×
							</Badge>
						))}
					</div>
				)}

				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger>
						<Button disabled={selected.length === 0} className="w-full">
							<HugeiconsIcon icon={SentIcon} size={16} />
							Assign to Class ({selected.length})
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Confirm Assignment</DialogTitle>
							<DialogDescription>
								This will assign practice quizzes on {selected.length} topic
								{selected.length > 1 ? "s" : ""} to all students in your class.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={() => {
									onAssign(selected);
									setSelected([]);
									setOpen(false);
								}}
							>
								Confirm Assignment
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	);
}
