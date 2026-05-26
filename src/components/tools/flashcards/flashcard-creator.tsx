"use client";

import { m } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { useSpacedRepetition } from "@/hooks/use-spaced-repetition";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

interface FormFields {
	front: string;
	back: string;
	hint: string;
	subject: string;
	topic: string;
}

interface FlashcardCreatorProps {
	className?: string;
}

let migrated = false;

async function migrateLegacyFlashcards(
	addCard: (
		front: string,
		back: string,
		subject: string,
		topic?: string,
	) => Promise<void>,
) {
	if (migrated) return;
	migrated = true;
	try {
		const raw = localStorage.getItem("lumni-flashcards:v1");
		if (!raw) return;
		const legacy = JSON.parse(raw) as Array<{
			id: string;
			front: string;
			back: string;
			hint?: string;
			subject?: string;
			topic?: string;
		}>;
		if (legacy.length === 0) return;

		const existing = await flashcardEngine.getAll();
		if (existing.length > 0) return;

		for (const card of legacy) {
			const backText = card.hint
				? `${card.back}\n\n**Hint:** ${card.hint}`
				: card.back;
			await addCard(card.front, backText, card.subject || "", card.topic || "");
		}
		localStorage.removeItem("lumni-flashcards:v1");
	} catch {}
}

function FlashcardForm({
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

export function FlashcardCreator({ className }: FlashcardCreatorProps) {
	return (
		<AppErrorBoundary>
			<FlashcardCreatorInner className={className} />
		</AppErrorBoundary>
	);
}

function FlashcardCreatorInner({ className }: FlashcardCreatorProps) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	const { cards, addCard, editCard, removeCard, refresh } =
		useSpacedRepetition();

	const migrateAndRefresh = useCallback(async () => {
		await migrateLegacyFlashcards(addCard);
		await refresh();
	}, [addCard, refresh]);

	useEffect(() => {
		migrateAndRefresh();
	}, [migrateAndRefresh]);

	const [isCreating, setIsCreating] = useState(false);
	const [editingCardId, setEditingCardId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	const handleEditFlashcard = (card: (typeof cards)[number]) => {
		setEditingCardId(card.id);
		setIsCreating(true);
	};

	const handleDeleteFlashcard = async (id: string) => {
		await removeCard(id);
	};

	const filteredCards = cards.filter(
		(card) =>
			card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
			card.back.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<m.div
			className={cn("mx-auto w-full max-w-2xl", className)}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			transition={{ duration: 0.25, ease: iOSEase }}
		>
			<Card className="mb-6">
				<CardHeader className="pb-4">
					<CardTitle className="font-bold text-2xl">
						Flashcard Creator
					</CardTitle>
					<p className="text-muted-foreground">
						Create, organize, and study with custom flashcards
					</p>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="min-w-0 flex-1">
							<Input
								placeholder="Search flashcards..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="mb-2"
							/>
							{cards.length > 0 && (
								<p className="text-muted-foreground text-xs">
									{cards.length} flashcards total
								</p>
							)}
						</div>
						<Button
							variant="outline"
							onClick={() => setIsCreating(true)}
							className="shrink-0"
						>
							New Flashcard
						</Button>
					</div>
				</CardContent>
			</Card>

			{filteredCards.length > 0 && (
				<Card>
					<CardHeader className="pb-4">
						<CardTitle className="font-medium text-lg">
							Your Flashcards
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						{filteredCards.map((card) => (
							<m.div
								key={card.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -10 }}
								transition={{ duration: 0.2, ease: iOSEase }}
								className="cursor-pointer rounded-3xl border p-4 transition-colors hover:bg-accent/5"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<MarkdownRenderer
											content={card.front}
											subject={card.subject}
											className="mb-2 font-medium"
										/>
									</div>
									<div className="flex items-center gap-2 text-xs">
										{card.subject && (
											<span className="rounded bg-secondary/50 px-2 py-0.5 text-xs">
												{card.subject}
											</span>
										)}
										{card.topic && (
											<span className="rounded bg-secondary/50 px-2 py-0.5 text-xs">
												{card.topic}
											</span>
										)}
									</div>
								</div>
								<div className="mt-3 flex justify-end gap-x-2">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleEditFlashcard(card)}
										aria-label="Edit flashcard"
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
												<title>Edit flashcard</title>
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4-1 1-4 9.5-9.5z" />
											</svg>
										</m.div>
									</Button>
									<Button
										variant="destructive"
										size="icon"
										onClick={() => handleDeleteFlashcard(card.id)}
										aria-label="Delete flashcard"
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
												<title>Delete flashcard</title>
												<path d="M3 6h18" />
												<path d="M19 9v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
												<path d="M8 6v.01" />
												<path d="M16 6v.01" />
											</svg>
										</m.div>
									</Button>
								</div>
							</m.div>
						))}
					</CardContent>
				</Card>
			)}

			{filteredCards.length === 0 && cards.length > 0 && (
				<Card className="py-8 text-center">
					<p className="text-muted-foreground">
						No flashcards match your search
					</p>
				</Card>
			)}

			{filteredCards.length === 0 && cards.length === 0 && (
				<Card className="py-8 text-center">
					<p className="text-muted-foreground">
						You haven't created any flashcards yet. Click "New Flashcard" to get
						started!
					</p>
				</Card>
			)}

			<Dialog open={isCreating} onOpenChange={setIsCreating}>
				<DialogContent className="w-full max-w-md sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{editingCardId ? "Edit Flashcard" : "Create New Flashcard"}
						</DialogTitle>
						<DialogDescription>
							Create or edit a flashcard for studying
						</DialogDescription>
					</DialogHeader>
					<FlashcardForm
						initialValues={
							editingCardId
								? (() => {
										const c = cards.find((c) => c.id === editingCardId);
										if (!c) return undefined;
										return {
											front: c.front,
											back: c.back,
											hint: "",
											subject: c.subject,
											topic: c.topic || "",
										};
									})()
								: undefined
						}
						onSubmit={async (data) => {
							if (editingCardId) {
								await editCard(editingCardId, {
									front: data.front,
									back: data.back,
									subject: data.subject,
									topic: data.topic,
								});
							} else {
								const backText = data.hint
									? `${data.back}\n\n**Hint:** ${data.hint}`
									: data.back;
								await addCard(data.front, backText, data.subject, data.topic);
							}
							setIsCreating(false);
							setEditingCardId(null);
						}}
						onCancel={() => {
							setIsCreating(false);
							setEditingCardId(null);
						}}
					/>
				</DialogContent>
			</Dialog>
		</m.div>
	);
}
