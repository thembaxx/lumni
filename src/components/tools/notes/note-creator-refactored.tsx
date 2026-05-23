"use client";

import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { NoteEditor } from "@/components/molecules/note-editor";
import { NoteList } from "@/components/molecules/note-list";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface Note {
	id: string;
	title: string;
	content: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export function NoteCreatorRefactored({ className }: { className?: string }) {
	const [notes, setNotes] = useState<Note[]>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("lumni-notes:v1");
			return saved ? (JSON.parse(saved) as Note[]) : [];
		}
		return [];
	});
	const [editingId, setEditingId] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	useEffect(() => {
		localStorage.setItem("lumni-notes:v1", JSON.stringify(notes));
	}, [notes]);

	const addNote = useCallback((data: { title: string; content: string }) => {
		const note: Note = {
			id: Math.random().toString(36).slice(2, 9),
			title: data.title,
			content: data.content,
			tags: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		setNotes((prev) => [note, ...prev]);
		setDialogOpen(false);
	}, []);

	const updateNote = useCallback(
		(id: string, data: { title: string; content: string }) => {
			setNotes((prev) =>
				prev.map((n) =>
					n.id === id
						? { ...n, ...data, updatedAt: new Date().toISOString() }
						: n,
				),
			);
			setEditingId(null);
			setDialogOpen(false);
		},
		[],
	);

	const deleteNote = useCallback((id: string) => {
		setNotes((prev) => prev.filter((n) => n.id !== id));
	}, []);

	const currentNote = editingId
		? notes.find((n) => n.id === editingId)
		: undefined;

	return (
		<AppErrorBoundary>
			<Card className={className}>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="flex items-center gap-2 font-heading text-base">
						<HugeiconsIcon icon={BookOpen01Icon} size={20} />
						My Notes
					</CardTitle>
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger>
							<Button size="sm" onClick={() => setEditingId(null)}>
								+ New Note
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-lg">
							<DialogHeader>
								<DialogTitle>
									{editingId ? "Edit Note" : "New Note"}
								</DialogTitle>
							</DialogHeader>
							<NoteEditor
								initialTitle={currentNote?.title}
								initialContent={currentNote?.content}
								onSave={
									editingId ? (data) => updateNote(editingId, data) : addNote
								}
							/>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					<NoteList
						notes={notes.map((n) => ({
							id: n.id,
							title: n.title,
							content: n.content,
							updatedAt: n.updatedAt,
						}))}
						onEdit={(id) => {
							setEditingId(id);
							setDialogOpen(true);
						}}
						onDelete={deleteNote}
					/>
				</CardContent>
			</Card>
		</AppErrorBoundary>
	);
}
