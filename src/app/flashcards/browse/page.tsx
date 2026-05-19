"use client";

import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Delete02Icon,
	Download03Icon,
	FilterIcon,
	Search01Icon,
	Upload04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { flashcardRepository } from "@/lib/flashcard-repository";
import type { FlashcardSM2 } from "@/lib/flashcard-repository/types";
import { downloadCSV, parseCSV } from "@/lib/utils/flashcard-import-export";

export default function FlashcardBrowsePage() {
	const [cards, setCards] = useState<FlashcardSM2[]>([]);
	const [search, setSearch] = useState("");
	const [subjectFilter, setSubjectFilter] = useState<string>("all");
	const [subjects, setSubjects] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [importing, setImporting] = useState(false);
	const [page, setPage] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const PAGE_SIZE = 20;

	const loadCards = useCallback(async () => {
		setLoading(true);
		try {
			const all = await flashcardRepository.getAll(
				subjectFilter !== "all" ? subjectFilter : undefined,
			);
			const filtered = search
				? all.filter(
						(c) =>
							c.front.toLowerCase().includes(search.toLowerCase()) ||
							c.back.toLowerCase().includes(search.toLowerCase()),
					)
				: all;
			setCards(filtered);
			const uniqueSubjects = [...new Set(all.map((c) => c.subject))].sort();
			setSubjects(uniqueSubjects);
		} finally {
			setLoading(false);
		}
	}, [search, subjectFilter]);

	useEffect(() => {
		loadCards();
	}, [loadCards]);

	const handleDelete = async (id: string) => {
		await flashcardRepository.delete(id);
		loadCards();
	};

	const handleExport = () => {
		downloadCSV(cards);
	};

	const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImporting(true);
		try {
			const text = await file.text();
			const imported = parseCSV(text);
			for (const card of imported) {
				await flashcardRepository.create(
					card.front,
					card.back,
					card.subject,
					card.topic,
				);
			}
			loadCards();
		} finally {
			setImporting(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const paginated = cards.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
	const totalPages = Math.ceil(cards.length / PAGE_SIZE);

	return (
		<div className="container mx-auto py-8 px-4 max-w-4xl">
			<h1 className="text-2xl font-extrabold mb-6">Browse Flashcards</h1>

			<div className="flex gap-3 mb-6 flex-wrap">
				<div className="relative flex-1 min-w-[200px]">
					<HugeiconsIcon
						icon={Search01Icon}
						className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
					/>
					<Input
						placeholder="Search cards..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(0);
						}}
						className="pl-9"
					/>
				</div>
				<select
					value={subjectFilter}
					onChange={(e) => {
						setSubjectFilter(e.target.value);
						setPage(0);
					}}
					className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
				>
					<option value="all">All subjects</option>
					{subjects.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
				<Button variant="outline" size="sm" onClick={loadCards}>
					<HugeiconsIcon icon={FilterIcon} className="h-4 w-4 mr-1" />
					Refresh
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={handleExport}
					disabled={cards.length === 0}
				>
					<HugeiconsIcon icon={Download03Icon} className="h-4 w-4 mr-1" />
					Export CSV
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => fileInputRef.current?.click()}
					disabled={importing}
				>
					<HugeiconsIcon icon={Upload04Icon} className="h-4 w-4 mr-1" />
					{importing ? "Importing..." : "Import CSV"}
				</Button>
				<input
					ref={fileInputRef}
					type="file"
					accept=".csv"
					onChange={handleImport}
					className="hidden"
				/>
			</div>

			{loading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="h-24 rounded-xl bg-muted/30 animate-pulse"
						/>
					))}
				</div>
			) : paginated.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					{search || subjectFilter !== "all"
						? "No cards match your filters."
						: "No flashcards yet. Create some from the study page!"}
				</div>
			) : (
				<>
					<p className="text-sm text-muted-foreground mb-4">
						{cards.length} card{cards.length !== 1 ? "s" : ""}
					</p>
					<div className="space-y-3">
						{paginated.map((card) => (
							<Card key={card.id} className="overflow-hidden">
								<CardContent className="p-4">
									<div className="flex justify-between items-start gap-4">
										<div className="flex-1 min-w-0">
											<div className="font-medium mb-1 line-clamp-2">
												{card.front}
											</div>
											<div className="text-sm text-muted-foreground line-clamp-2">
												{card.back}
											</div>
											<div className="flex gap-2 mt-2 flex-wrap">
												<span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
													{card.subject}
												</span>
												{card.topic && (
													<span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/30 text-muted-foreground">
														{card.topic}
													</span>
												)}
												<span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">
													Ease: {card.easeFactor.toFixed(1)}
												</span>
												<span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">
													Interval: {card.interval}d
												</span>
												{card.nextReview > Date.now() ? (
													<span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">
														Due {new Date(card.nextReview).toLocaleDateString()}
													</span>
												) : (
													<span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
														Overdue
													</span>
												)}
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDelete(card.id)}
											aria-label="Delete card"
										>
											<HugeiconsIcon
												icon={Delete02Icon}
												className="h-4 w-4 text-destructive"
											/>
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-4 mt-6">
							<Button
								variant="outline"
								size="sm"
								disabled={page === 0}
								onClick={() => setPage((p) => p - 1)}
							>
								<HugeiconsIcon
									icon={ArrowLeft01Icon}
									className="h-4 w-4 mr-1"
								/>{" "}
								Previous
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {page + 1} of {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages - 1}
								onClick={() => setPage((p) => p + 1)}
							>
								Next{" "}
								<HugeiconsIcon
									icon={ArrowRight01Icon}
									className="h-4 w-4 ml-1"
								/>
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
