"use client";

import { Delete01Icon, Edit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TTSButton } from "@/components/shared/tts-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/shared";

interface NoteItem {
	id: string;
	title: string;
	content: string;
	updatedAt: string;
}

interface NoteListProps extends React.ComponentProps<"div"> {
	notes: NoteItem[];
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
}

export function NoteList({
	notes,
	onEdit,
	onDelete,
	className,
	...props
}: NoteListProps) {
	return (
		<div className={cn("flex flex-col gap-2", className)} {...props}>
			<ScrollArea className="h-96">
				<div className="flex flex-col gap-2 pr-3">
					{notes.map((note) => (
						<Card
							key={note.id}
							className="group cursor-pointer transition-colors hover:bg-accent/50"
						>
							<CardContent className="flex items-center justify-between p-3">
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">{note.title}</p>
									<p className="truncate text-muted-foreground text-xs">
										{note.content.slice(0, 60)}...
									</p>
									<p className="mt-1 text-muted-foreground text-xs">
										{new Date(note.updatedAt).toLocaleDateString()}
									</p>
								</div>
								<div className="flex items-center gap-1">
									<TTSButton text={note.content} />
									<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={() => onEdit(note.id)}
											aria-label={`Edit ${note.title}`}
										>
											<HugeiconsIcon icon={Edit01Icon} size={14} />
										</Button>
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={() => onDelete(note.id)}
											aria-label={`Delete ${note.title}`}
										>
											<HugeiconsIcon icon={Delete01Icon} size={14} />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
					{notes.length === 0 && (
						<p className="py-8 text-center text-muted-foreground text-sm">
							No notes yet.
						</p>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
