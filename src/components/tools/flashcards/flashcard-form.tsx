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

export interface FormFields {
	front: string;
	back: string;
	hint: string;
	subject: string;
	topic: string;
}

export function FlashcardForm({
	onSubmit,
	onCancel,
	initialValues,
}: {
	onSubmit: (data: FormFields) => void;
	onCancel: () => void;
	initialValues?: FormFields;
}) {
	const [formData, setFormData] = useState<FormFields>({
		front: "",
		back: "",
		hint: "",
		subject: "",
		topic: "",
		...initialValues,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<Label htmlFor="front">Front</Label>
				<Textarea
					id="front"
					name="front"
					value={formData.front}
					onChange={handleInputChange}
					placeholder="What is the question or prompt?"
					className="min-h-20"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="back">Back</Label>
				<Textarea
					id="back"
					name="back"
					value={formData.back}
					onChange={handleInputChange}
					placeholder="What is the answer or explanation?"
					className="min-h-20"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="hint">Hint (Optional)</Label>
				<Input
					id="hint"
					name="hint"
					value={formData.hint}
					onChange={handleInputChange}
					placeholder="Enter a hint to help recall the answer"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="subject">Subject (Optional)</Label>
				<Select
					value={formData.subject}
					onValueChange={(value) =>
						setFormData((prev) => ({
							...prev,
							subject: value ?? "",
						}))
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

			<div className="flex flex-col gap-2">
				<Label htmlFor="topic">Topic (Optional)</Label>
				<Input
					id="topic"
					name="topic"
					value={formData.topic}
					onChange={handleInputChange}
					placeholder="e.g., algebra, photosynthesis, world war II"
				/>
			</div>

			<div className="flex justify-end gap-x-3">
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
					Create Flashcard
				</Button>
			</div>
		</form>
	);
}
