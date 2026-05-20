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
import type { Metadata } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { flashcardRepository } from "@/lib/flashcard-repository";
import type { FlashcardSM2 } from "@/lib/flashcard-repository/types";
import { downloadCSV, parseCSV } from "@/lib/utils/flashcard-import-export";

export const metadata: Metadata = {
	title: "Browse Flashcards",
};

export default function FlashcardBrowsePage() {
	const [cards, setCards] = useState<FlashcardSM2[]>([]);
	const [search, setSearch] = useState("");
	const [subjectFilter, setSubjectFilter] = useState<string>("all");
	const [subjects, setSubjects] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [importing, setImporting] = useState(false);
	const [page, setPage] = useState(0);
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);
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
			const uniqueSubjects = [...new Set(all.map((c) => c.subject))].toSorted();
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
			await Promise.all(
				imported.map((card) =>
					flashcardRepository.create(
						card.front,
						card.back,
						card.subject,
						card.topic,
					),
				),
			);
			loadCards();
		} finally {
			setImporting(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const paginated = cards.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
	const totalPages = Math.ceil(cards.length / PAGE_SIZE);

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<h1 className="mb-6 font-semibold text-2xl">Browse Flashcards</h1>

			<div className="mb-6 flex flex-wrap gap-3">
				<div className="relative min-w-[200px] flex-1">
					<HugeiconsIcon
						icon={Search01Icon}
						className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
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
					className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
				>
					<option value="all">All subjects</option>
					{subjects.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
				<Button variant="outline" size="sm" onClick={loadCards}>
					<HugeiconsIcon icon={FilterIcon} className="mr-1 size-4" />
					Refresh
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={handleExport}
					disabled={cards.length === 0}
				>
					<HugeiconsIcon icon={Download03Icon} className="mr-1 size-4" />
					Export CSV
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => fileInputRef.current?.click()}
					disabled={importing}
				>
					<HugeiconsIcon icon={Upload04Icon} className="mr-1 size-4" />
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
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
							key={i}
							className="h-24 animate-pulse rounded-xl bg-muted/30"
						/>
					))}
				</div>
			) : paginated.length === 0 ? (
				<div className="py-12 text-center text-muted-foreground">
					{search || subjectFilter !== "all"
						? "No cards match your filters."
						: "No flashcards yet. Create some from the study page!"}
				</div>
			) : (
				<>
					<p className="mb-4 text-muted-foreground text-sm">
						{cards.length} card{cards.length !== 1 ? "s" : ""}
					</p>
					<div className="space-y-3">
						{paginated.map((card) => (
							<Card key={card.id} className="overflow-hidden">
								<CardContent className="p-4">
									<div className="flex items-start justify-between gap-4">
										<div className="min-w-0 flex-1">
											<div className="mb-1 line-clamp-2 font-medium">
												{card.front}
											</div>
											<div className="line-clamp-2 text-muted-foreground text-sm">
												{card.back}
											</div>
											<div className="mt-2 flex flex-wrap gap-2">
												<span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
													{card.subject}
												</span>
												{card.topic && (
													<span className="rounded bg-secondary/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
														{card.topic}
													</span>
												)}
												<span className="rounded bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
													Ease: {card.easeFactor.toFixed(1)}
												</span>
												<span className="rounded bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
													Interval: {card.interval}d
												</span>
												{mounted ? (
													card.nextReview > Date.now() ? (
														<span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-600">
															Due{" "}
															{new Date(card.nextReview).toLocaleDateString()}
														</span>
													) : (
														<span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600">
															Overdue
														</span>
													)
												) : null}
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
												className="size-4 text-destructive"
											/>
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{totalPages > 1 && (
						<div className="mt-6 flex items-center justify-center gap-4">
							<Button
								variant="outline"
								size="sm"
								disabled={page === 0}
								onClick={() => setPage((p) => p - 1)}
							>
								<HugeiconsIcon icon={ArrowLeft01Icon} className="mr-1 size-4" />{" "}
								Previous
							</Button>
							<span className="text-muted-foreground text-sm">
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
									className="ml-1 size-4"
								/>
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
