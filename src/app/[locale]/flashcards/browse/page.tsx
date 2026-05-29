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
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { flashcardEngine } from "@/lib/flashcard-engine";
import type { FlashcardSM2 } from "@/lib/flashcard-engine/types";
import { downloadCSV, parseCSV } from "@/lib/utils/flashcard-import-export";

// TODO(react-doctor): Refactor multiple useState calls into useReducer
export default function FlashcardBrowsePage() {
	const t = useTranslations();
	const [cards, setCards] = useState<FlashcardSM2[]>([]);
	const [search, setSearch] = useState("");
	const [subjectFilter, setSubjectFilter] = useState<string>("all");
	const [subjects, setSubjects] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [importing, setImporting] = useState(false);
	const [page, setPage] = useState(0);
	const [now, setNow] = useState(0);
	useEffect(() => {
		setNow(Date.now());
	}, []);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const PAGE_SIZE = 20;

	const loadCards = useCallback(async () => {
		setLoading(true);
		try {
			const all = await flashcardEngine.getAll(
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
		await flashcardEngine.delete(id);
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
					flashcardEngine.create(
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
		<PageContainer className="py-8">
			<h1 className="mb-6 font-semibold text-2xl">
				{t("flashcards.browseTitle")}
			</h1>

			<div className="mb-6 flex flex-wrap gap-3">
				<div className="relative min-w-[200px] flex-1">
					<HugeiconsIcon
						icon={Search01Icon}
						className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						placeholder={t("flashcards.searchPlaceholder")}
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
					<option value="all">{t("flashcards.allSubjects")}</option>
					{subjects.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
				<Button variant="outline" size="sm" onClick={loadCards}>
					<HugeiconsIcon icon={FilterIcon} className="mr-1 size-4" />
					{t("flashcards.refresh")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={handleExport}
					disabled={cards.length === 0}
				>
					<HugeiconsIcon icon={Download03Icon} className="mr-1 size-4" />
					{t("flashcards.exportCsv")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => fileInputRef.current?.click()}
					disabled={importing}
				>
					<HugeiconsIcon icon={Upload04Icon} className="mr-1 size-4" />
					{importing ? t("flashcards.importing") : t("flashcards.importCsv")}
				</Button>
				<input
					ref={fileInputRef}
					type="file"
					accept=".csv"
					onChange={handleImport}
					className="hidden"
					aria-label={t("flashcards.importCsvAria")}
				/>
			</div>

			{loading ? (
				<div className="flex flex-col gap-3">
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
						? t("flashcards.noMatchFilters")
						: t("flashcards.browseEmpty")}
				</div>
			) : (
				<>
					<p className="mb-4 text-muted-foreground text-sm">
						{t("flashcards.cardCount", { count: cards.length })}
					</p>
					<div className="flex flex-col gap-3">
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
													{t("flashcards.ease")}: {card.easeFactor.toFixed(1)}
												</span>
												<span className="rounded bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
													{t("flashcards.interval")}: {card.interval}d
												</span>
												{card.nextReview > now ? (
													<span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-600">
														{t("flashcards.dueLabel")}{" "}
														{new Date(card.nextReview).toLocaleDateString()}
													</span>
												) : (
													<span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600">
														{t("flashcards.overdue")}
													</span>
												)}
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDelete(card.id)}
											aria-label={t("flashcards.deleteCard")}
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
								{t("flashcards.previous")}
							</Button>
							<span className="text-muted-foreground text-sm">
								{t("flashcards.pageInfo", { page: page + 1, totalPages })}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages - 1}
								onClick={() => setPage((p) => p + 1)}
							>
								{t("flashcards.next")}{" "}
								<HugeiconsIcon
									icon={ArrowRight01Icon}
									className="ml-1 size-4"
								/>
							</Button>
						</div>
					)}
				</>
			)}
		</PageContainer>
	);
}
