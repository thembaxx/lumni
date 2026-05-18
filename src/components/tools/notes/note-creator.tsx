"use client";

import { m, motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandGroupItems,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

interface Note {
	id: string;
	title: string;
	content: string;
	tags?: string[];
	subject?: string;
	topic?: string;
	createdAt: string;
	updatedAt: string;
	isFavorite?: boolean;
}

interface NoteCreatorProps {
	className?: string;
}

export function useNoteStorage() {
	const [notes, setNotes] = useState<Note[]>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("lumni-notes");
			return saved ? JSON.parse(saved) : [];
		}
		return [];
	});

	const saveNotes = useCallback((notes: Note[]) => {
		setNotes(notes);
		if (typeof window !== "undefined") {
			localStorage.setItem("lumni-notes", JSON.stringify(notes));
		}
	}, []);

	const writeLocalStorage = useCallback((notes: Note[]) => {
		if (typeof window !== "undefined") {
			localStorage.setItem("lumni-notes", JSON.stringify(notes));
		}
	}, []);

	const addNote = useCallback(
		(note: Note) => {
			setNotes((prev) => {
				const next = [...prev, note];
				writeLocalStorage(next);
				return next;
			});
		},
		[writeLocalStorage],
	);

	const removeNote = useCallback(
		(id: string) => {
			setNotes((prev) => {
				const next = prev.filter((note) => note.id !== id);
				writeLocalStorage(next);
				return next;
			});
		},
		[writeLocalStorage],
	);

	const updateNote = useCallback(
		(id: string, updates: Partial<Note>) => {
			setNotes((prev) => {
				const next = prev.map((note) =>
					note.id === id
						? { ...note, ...updates, updatedAt: new Date().toISOString() }
						: note,
				);
				writeLocalStorage(next);
				return next;
			});
		},
		[writeLocalStorage],
	);

	const toggleFavorite = useCallback(
		(id: string) => {
			setNotes((prev) => {
				const next = prev.map((note) =>
					note.id === id ? { ...note, isFavorite: !note.isFavorite } : note,
				);
				writeLocalStorage(next);
				return next;
			});
		},
		[writeLocalStorage],
	);

	return {
		notes,
		addNote,
		removeNote,
		updateNote,
		toggleFavorite,
		saveNotes,
	};
}

function NoteForm({
	onSubmit,
	onCancel,
	initialValues,
}: {
	onSubmit: (data: Note) => void;
	onCancel: () => void;
	initialValues?: Partial<Note>;
}) {
	const [formData, setFormData] = useState<Note>({
		id: "",
		title: "",
		content: "",
		tags: [],
		subject: "",
		topic: "",
		createdAt: "",
		updatedAt: "",
		isFavorite: false,
		...initialValues,
	});

	const { shouldReduceMotion: shouldReduceMotionOpt } = useOptimizedAnimation();
	const _shouldReduceMotion = useReducedMotion() || shouldReduceMotionOpt;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const note: Note = {
			...formData,
			id: formData.id || Math.random().toString(36).substr(2, 9),
			createdAt: formData.createdAt || new Date().toISOString(),
			updatedAt: formData.updatedAt || new Date().toISOString(),
		};
		onSubmit(note);
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		if (name === "tags") {
			setFormData((prev) => ({
				...prev,
				[name]: value
					.split(",")
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0),
			}));
		} else {
			setFormData((prev) => ({ ...prev, [name]: value }));
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="title">Title</Label>
				<Input
					id="title"
					name="title"
					value={formData.title || ""}
					onChange={handleInputChange}
					placeholder="Enter note title"
					disabled={false}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="content">Content</Label>
				<Textarea
					id="content"
					name="content"
					value={formData.content || ""}
					onChange={handleInputChange}
					placeholder="Write your note content here..."
					className="min-h-50"
					disabled={false}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="hint">Tags (Optional)</Label>
				<Input
					id="tags"
					name="tags"
					value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""}
					onChange={handleInputChange}
					placeholder="e.g., biology, mitosis, cell-division"
					disabled={false}
				/>
				<p className="text-xs text-muted-foreground mt-1">
					Separate tags with commas
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="subject">Subject (Optional)</Label>
				<Select
					id="subject"
					name="subject"
					value={formData.subject || ""}
					onValueChange={(value) =>
						setFormData((prev) => ({ ...prev, subject: value || "" }))
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a subject" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="mathematics">Mathematics</SelectItem>
						<SelectItem value="physical-sciences">Physical Sciences</SelectItem>
						<SelectItem value="life-sciences">Life Sciences</SelectItem>
						<SelectItem value="humanities">Humanities</SelectItem>
						<SelectItem value="languages">Languages</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label htmlFor="topic">Topic (Optional)</Label>
				<Input
					id="topic"
					name="topic"
					value={formData.topic || ""}
					onChange={handleInputChange}
					placeholder="e.g., algebra, photosynthesis, world war II"
					disabled={false}
				/>
			</div>

			<div className="flex items-center space-x-3">
				<Label
					htmlFor="favorite"
					className="text-sm font-medium flex items-center"
				>
					<input
						type="checkbox"
						id="favorite"
						checked={formData.isFavorite ?? false}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, isFavorite: e.target.checked }))
						}
						className="h-4 w-4 text-primary rounded border-gray-300"
					/>
					Mark as favorite
				</Label>
			</div>

			<div className="flex justify-end space-x-3 mt-4">
				<Button
					variant="outline"
					size="icon"
					asChild
					onClick={onCancel}
					aria-label="Cancel"
				>
					<m.div
						whileTap={{ scale: 0.95 }}
						transition={{ duration: 0.2, ease: iOSEase }}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M18 6L6 18" />
							<path d="M6 6l12 12" />
						</svg>
					</m.div>
				</Button>

				<Button type="submit" className="btn-primary">
					{initialValues ? "Update Note" : "Create Note"}
				</Button>
			</div>
		</form>
	);
}

export function NoteCreator({ className }: NoteCreatorProps) {
	const { notes, addNote, removeNote, updateNote, toggleFavorite } =
		useNoteStorage();
	const [_isCreating, setIsCreating] = useState(false);
	const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState<"all" | "favorites">("all");
	const { shouldReduceMotion: shouldReduceMotionOpt } = useOptimizedAnimation();
	const _finalShouldReduceMotion = useReducedMotion() || shouldReduceMotionOpt;

	const handleCreateNote = (note: Note) => {
		addNote(note);
		setIsCreating(false);
	};

	const handleUpdateNote = (note: Note) => {
		if (editingNoteId) {
			updateNote(editingNoteId, note);
		}
		setIsCreating(false);
		setEditingNoteId(null);
	};

	const handleDeleteNote = (id: string) => {
		removeNote(id);
	};

	const handleToggleFavorite = (id: string) => {
		toggleFavorite(id);
	};

	const filteredNotes = notes
		.filter(
			(note) =>
				note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(note.tags || []).some((tag) =>
					tag.toLowerCase().includes(searchQuery.toLowerCase()),
				),
		)
		.filter((note) => {
			if (filter === "favorites") {
				return note.isFavorite === true;
			}
			return true;
		});

	return (
		<motion.div
			className={cn("w-full max-w-2xl mx-auto", className)}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			transition={{ duration: 0.25, ease: iOSEase }}
		>
			<Card className="mb-6">
				<CardHeader className="pb-4">
					<CardTitle className="text-2xl font-bold">Note Creator</CardTitle>
					<p className="text-muted-foreground">
						Create, organize, and review your study notes
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex-1 min-w-0">
							<Input
								placeholder="Search notes..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="mb-2"
							/>
							{notes.length > 0 && (
								<p className="text-xs text-muted-foreground">
									{notes.length} notes total
								</p>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								onClick={() => setFilter("all")}
								className={cn(
									"px-3 py-1 rounded text-sm",
									filter === "all"
										? "bg-accent/20 text-accent"
										: "text-muted-foreground hover:bg-accent/10",
								)}
							>
								All
							</Button>
							<Button
								variant="outline"
								onClick={() => setFilter("favorites")}
								className={cn(
									"px-3 py-1 rounded text-sm",
									filter === "favorites"
										? "bg-accent/20 text-accent"
										: "text-muted-foreground hover:bg-accent/10",
								)}
							>
								Favorites ({notes.filter((n) => n.isFavorite).length})
							</Button>
						</div>
						<Button
							variant="outline"
							onClick={() => setIsCreating(true)}
							className="shrink-0"
						>
							New Note
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Note List */}
			{filteredNotes.length > 0 && (
				<Card>
					<CardHeader className="pb-4">
						<CardTitle className="text-lg font-medium">Your Notes</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{filteredNotes.map((note) => (
							<motion.div
								key={note.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, ease: iOSEase }}
								className="border rounded-[2rem] p-4 cursor-pointer hover:bg-accent/5 transition-colors"
								tabIndex={0}
								role="button"
								aria-label={`Note: ${note.title}`}
							>
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<h3 className="font-semibold mb-1">{note.title}</h3>
										<div className="text-sm text-muted-foreground line-clamp-2">
											{note.content.substring(0, 100)}
											{note.content.length > 100 ? "..." : ""}
										</div>
										{note.tags && note.tags.length > 0 && (
											<div className="mt-2 flex flex-wrap gap-1">
												{note.tags.map((tag) => (
													<span
														key={tag}
														className="px-2 py-0.5 text-xs rounded bg-secondary/50"
													>
														{tag}
													</span>
												))}
											</div>
										)}
										{note.subject && (
											<div className="mt-1 flex items-center gap-1 text-xs">
												<div className="h-2 w-2 rounded bg-accent/20" />
												<span>{note.subject}</span>
											</div>
										)}
									</div>
									<div className="flex items-center gap-2 text-xs">
										{note.isFavorite && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleToggleFavorite(note.id)}
												aria-label="Remove from favorites"
											>
												<m.div
													whileTap={{ scale: 0.95 }}
													transition={{ duration: 0.2, ease: iOSEase }}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="16"
														height="16"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth={2}
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
													</svg>
												</m.div>
											</Button>
										)}
										<span className="ml-2">
											{new Date(note.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
								<div className="mt-3 flex justify-end space-x-2">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setEditingNoteId(note.id);
											setIsCreating(true);
										}}
										aria-label="Edit note"
									>
										<m.div
											whileTap={{ scale: 0.95 }}
											transition={{ duration: 0.2, ease: iOSEase }}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth={2}
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4-1 1-4 9.5-9.5z" />
											</svg>
										</m.div>
									</Button>
									<Button
										variant="destructive"
										size="icon"
										onClick={() => handleDeleteNote(note.id)}
										aria-label="Delete note"
									>
										<m.div
											whileTap={{ scale: 0.95 }}
											transition={{ duration: 0.2, ease: iOSEase }}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth={2}
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M3 6h18" />
												<path d="M19 9v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
												<path d="M8 6v.01" />
												<path d="M16 6v.01" />
											</svg>
										</m.div>
									</Button>
								</div>
							</motion.div>
						))}
					</CardContent>
				</Card>
			)}

			{/* Empty State */}
			{filteredNotes.length === 0 && notes.length > 0 && (
				<Card className="text-center py-8">
					<p className="text-muted-foreground">No notes match your search</p>
				</Card>
			)}

			{filteredNotes.length === 0 && notes.length === 0 && (
				<Card className="text-center py-8">
					<p className="text-muted-foreground">
						You haven't created any notes yet. Click "New Note" to get started!
					</p>
				</Card>
			)}

			{/* Create/Edit Note Modal */}
			<Dialog>
				<DialogTrigger>
					<Button
						variant="outline"
						onClick={() => setIsCreating(true)}
						className="hidden sm:block"
					>
						New Note
					</Button>
				</DialogTrigger>
				<DialogContent className="w-full max-w-md sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{editingNoteId ? "Edit Note" : "Create New Note"}
						</DialogTitle>
						<DialogDescription>
							Create or edit a note for studying
						</DialogDescription>
					</DialogHeader>
					<NoteForm
						initialValues={
							editingNoteId
								? notes.find((n) => n.id === editingNoteId) || undefined
								: undefined
						}
						onSubmit={(note) => {
							if (editingNoteId) {
								handleUpdateNote(note);
							} else {
								handleCreateNote(note);
							}
							setIsCreating(false);
							setEditingNoteId(null);
						}}
						onCancel={() => {
							setIsCreating(false);
							setEditingNoteId(null);
						}}
					/>
				</DialogContent>
			</Dialog>
		</motion.div>
	);
}
