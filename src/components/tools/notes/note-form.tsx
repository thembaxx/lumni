"use client";

import { m } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { iOSEase } from "@/lib/utils/animation";
import type { Note } from "./types";

export function NoteForm({
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
				[name]: value.split(",").reduce((acc, tag) => {
					const trimmed = tag.trim();
					if (trimmed.length > 0) acc.push(trimmed);
					return acc;
				}, [] as string[]),
			}));
		} else {
			setFormData((prev) => ({ ...prev, [name]: value }));
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="title">Title</FieldLabel>
					<Input
						id="title"
						name="title"
						value={formData.title || ""}
						onChange={handleInputChange}
						placeholder="Enter note title"
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="content">Content</FieldLabel>
					<Textarea
						id="content"
						name="content"
						value={formData.content || ""}
						onChange={handleInputChange}
						placeholder="Write your note content here..."
						className="min-h-50"
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="tags">Tags (Optional)</FieldLabel>
					<Input
						id="tags"
						name="tags"
						value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""}
						onChange={handleInputChange}
						placeholder="e.g., biology, mitosis, cell-division"
					/>
					<FieldDescription>Separate tags with commas</FieldDescription>
				</Field>

				<Field>
					<FieldLabel htmlFor="subject">Subject (Optional)</FieldLabel>
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
							<SelectItem value="physical-sciences">
								Physical Sciences
							</SelectItem>
							<SelectItem value="life-sciences">Life Sciences</SelectItem>
							<SelectItem value="humanities">Humanities</SelectItem>
							<SelectItem value="languages">Languages</SelectItem>
						</SelectContent>
					</Select>
				</Field>

				<Field>
					<FieldLabel htmlFor="topic">Topic (Optional)</FieldLabel>
					<Input
						id="topic"
						name="topic"
						value={formData.topic || ""}
						onChange={handleInputChange}
						placeholder="e.g., algebra, photosynthesis, world war II"
					/>
				</Field>

				<div className="flex items-center gap-x-3">
					<label
						htmlFor="favorite"
						className="flex cursor-pointer items-center gap-2 font-medium text-foreground text-xs/relaxed"
					>
						<input
							type="checkbox"
							id="favorite"
							checked={formData.isFavorite ?? false}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									isFavorite: e.target.checked,
								}))
							}
							className="size-4 rounded border-zinc-300 text-primary"
						/>
						Mark as favorite
					</label>
				</div>
			</FieldGroup>

			<div className="mt-4 flex justify-end gap-x-3">
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
					{initialValues ? "Update Note" : "Create Note"}
				</Button>
			</div>
		</form>
	);
}
