"use client";

import { m } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { iOSEase } from "@/lib/utils/animation";
import type { StudySet } from "./hooks/use-study-set-storage";

interface StudySetFormProps {
	onSubmit: (data: StudySet) => void;
	onCancel: () => void;
	initialValues?: Partial<StudySet>;
}

export function StudySetForm({
	onSubmit,
	onCancel,
	initialValues,
}: StudySetFormProps) {
	const [formData, setFormData] = useState<StudySet>({
		id: "",
		title: "",
		description: "",
		flashcardIds: [],
		noteIds: [],
		tags: [],
		subject: "",
		topic: "",
		createdAt: "",
		updatedAt: "",
		isFavorite: false,
		...initialValues,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const studySet: StudySet = {
			...formData,
			id: formData.id || Math.random().toString(36).substr(2, 9),
			createdAt: formData.createdAt || new Date().toISOString(),
			updatedAt: formData.updatedAt || new Date().toISOString(),
		};
		onSubmit(studySet);
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

	const handleFlashcardSelect = (flashcardId: string) => {
		setFormData((prev) => {
			const hasId = prev.flashcardIds.includes(flashcardId);
			return {
				...prev,
				flashcardIds: hasId
					? prev.flashcardIds.filter((id) => id !== flashcardId)
					: [...prev.flashcardIds, flashcardId],
			};
		});
	};

	const handleNoteSelect = (noteId: string) => {
		setFormData((prev) => {
			const hasId = prev.noteIds.includes(noteId);
			return {
				...prev,
				noteIds: hasId
					? prev.noteIds.filter((id) => id !== noteId)
					: [...prev.noteIds, noteId],
			};
		});
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
					placeholder="Enter study set title"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description (Optional)</Label>
				<Textarea
					id="description"
					name="description"
					value={formData.description || ""}
					onChange={handleInputChange}
					placeholder="Describe what this study set covers"
					className="min-h-20"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="flashcards">Flashcards</Label>
				<div className="space-y-2">
					<p className="mb-1 font-medium text-sm">
						Select flashcards to include:
					</p>
					{formData.flashcardIds.length > 0 ? (
						<div className="flex flex-wrap gap-1">
							{formData.flashcardIds
								.map((id) => {
									const card = formData.flashcards?.find((c) => c.id === id);
									if (!card) return null;
									return (
										<span
											key={id}
											className="rounded bg-accent/20 px-2 py-0.5 text-xs"
										>
											{card.front.substring(0, 20)}...
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleFlashcardSelect(id)}
												aria-label="Remove flashcard"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth={1}
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<title>Remove flashcard</title>
													<path d="M18 6L6 18" />
													<path d="M6 6l12 12" />
												</svg>
											</Button>
										</span>
									);
								})
								.filter(Boolean)}
						</div>
					) : (
						<p className="text-muted-foreground text-xs italic">
							No flashcards selected
						</p>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() => alert("Flashcard picker would open here")}
					>
						Add Flashcards
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="notes">Notes</Label>
				<div className="space-y-2">
					<p className="mb-1 font-medium text-sm">Select notes to include:</p>
					{formData.noteIds.length > 0 ? (
						<div className="flex flex-wrap gap-1">
							{formData.noteIds
								.map((id) => {
									const note = formData.notes?.find((n) => n.id === id);
									if (!note) return null;
									return (
										<span
											key={id}
											className="rounded bg-accent/20 px-2 py-0.5 text-xs"
										>
											{note.title.substring(0, 20)}...
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleNoteSelect(id)}
												aria-label="Remove note"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth={1}
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<title>Remove note</title>
													<path d="M18 6L6 18" />
													<path d="M6 6l12 12" />
												</svg>
											</Button>
										</span>
									);
								})
								.filter(Boolean)}
						</div>
					) : (
						<p className="text-muted-foreground text-xs italic">
							No notes selected
						</p>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() => alert("Notes picker would open here")}
					>
						Add Notes
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="tags">Tags (Optional)</Label>
				<Input
					id="tags"
					name="tags"
					value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""}
					onChange={handleInputChange}
					placeholder="e.g., biology, exam-prep, chapter-5"
				/>
				<p className="mt-1 text-muted-foreground text-xs">
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
				/>
			</div>

			<div className="flex items-center space-x-3">
				<Label
					htmlFor="favorite"
					className="flex items-center font-medium text-sm"
				>
					<input
						type="checkbox"
						id="favorite"
						checked={formData.isFavorite ?? false}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, isFavorite: e.target.checked }))
						}
						className="h-4 w-4 rounded border-gray-300 text-primary"
					/>
					Mark as favorite
				</Label>
			</div>

			<div className="mt-4 flex justify-end space-x-3">
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
							<title>Cancel</title>
							<path d="M18 6L6 18" />
							<path d="M6 6l12 12" />
						</svg>
					</m.div>
				</Button>

				<Button type="submit" className="btn-primary">
					{initialValues ? "Update Study Set" : "Create Study Set"}
				</Button>
			</div>
		</form>
	);
}
