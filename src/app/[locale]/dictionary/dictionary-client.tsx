"use client";

import {
	Bookmark02Icon,
	Bookmark03Icon,
	Search01Icon,
	VolumeUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useCallback, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { lookupWord } from "@/lib/dictionary/service";
import type { DictionaryResult } from "@/lib/dictionary/types";
import { logError } from "@/lib/shared/logger";
import { isWordSaved, removeWord, saveWord } from "@/lib/vocabulary/service";

export function DictionaryClient() {
	const { user } = useAuth();
	const userId = user?.$id ?? "anonymous";
	const [query, setQuery] = useState("");
	const [result, setResult] = useState<DictionaryResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [searched, setSearched] = useState(false);
	const [saved, setSaved] = useState(false);
	const [saving, setSaving] = useState(false);

	const handleSearch = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			const word = query.trim();
			if (!word) return;
			setLoading(true);
			setSearched(true);
			try {
				const data = await lookupWord(word, "en");
				setResult(data);
				if (data && userId !== "anonymous") {
					const alreadySaved = await isWordSaved(userId, word);
					setSaved(alreadySaved);
				}
			} catch (err) {
				logError("DictionaryClient.search", err);
				setResult(null);
			} finally {
				setLoading(false);
			}
		},
		[query, userId],
	);

	const playAudio = useCallback((url?: string) => {
		if (!url) return;
		const audio = new Audio(url);
		void audio.play();
	}, []);

	const handleSave = useCallback(async () => {
		if (saving || !result || userId === "anonymous") return;
		setSaving(true);
		try {
			if (saved) {
				await removeWord(userId, result.word);
				setSaved(false);
			} else {
				const def = result.definitions[0]?.definition ?? "";
				const pos = result.definitions[0]?.partOfSpeech;
				await saveWord(
					userId,
					result.word,
					def,
					"en",
					"manual",
					"dictionary",
					pos,
				);
				setSaved(true);
			}
		} catch (err) {
			logError("DictionaryClient.save", err);
		} finally {
			setSaving(false);
		}
	}, [saving, saved, userId, result]);

	return (
		<PageContainer>
			<div className="flex flex-col gap-6 py-6">
				<div className="flex flex-col gap-1">
					<h1 className="font-semibold text-2xl">Dictionary</h1>
					<p className="text-muted-foreground text-sm">
						Look up word definitions and save vocabulary for review.
					</p>
				</div>

				<form onSubmit={handleSearch} className="flex gap-2">
					<div className="relative flex-1">
						<HugeiconsIcon
							icon={Search01Icon}
							className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search for a word..."
							className="pl-9"
							aria-label="Search dictionary"
						/>
					</div>
					<Button type="submit" disabled={!query.trim() || loading}>
						Search
					</Button>
				</form>

				{loading && (
					<div className="flex flex-col gap-3">
						<Skeleton className="h-24 w-full rounded-xl" />
						<Skeleton className="h-16 w-full rounded-xl" />
					</div>
				)}

				<AnimatePresence mode="wait">
					{!loading && searched && !result && (
						<m.div
							key="not-found"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
						>
							<Card className="rounded-card">
								<CardContent className="flex flex-col items-center gap-2 p-8 text-center">
									<p className="text-muted-foreground text-sm">
										No definition found for &ldquo;{query}&rdquo;
									</p>
								</CardContent>
							</Card>
						</m.div>
					)}

					{!loading && result && (
						<m.div
							key={result.word}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
						>
							<Card className="overflow-hidden rounded-card shadow-level-1">
								<CardContent className="flex flex-col gap-4 p-5">
									<div className="flex items-start justify-between">
										<div className="flex flex-col gap-1">
											<h2 className="font-extrabold text-xl">{result.word}</h2>
											{result.phonetic && (
												<span className="text-muted-foreground text-sm">
													{result.phonetic}
												</span>
											)}
										</div>
										<div className="flex items-center gap-2">
											{result.audio && (
												<Button
													variant="ghost"
													size="icon"
													className="size-9 rounded-full"
													onClick={() => playAudio(result.audio)}
													aria-label={`Listen to ${result.word}`}
												>
													<HugeiconsIcon
														icon={VolumeUpIcon}
														className="size-4"
													/>
												</Button>
											)}
											{userId !== "anonymous" && (
												<Button
													variant={saved ? "default" : "outline"}
													size="sm"
													className="rounded-full text-xs"
													onClick={handleSave}
													disabled={saving}
												>
													<HugeiconsIcon
														icon={saved ? Bookmark03Icon : Bookmark02Icon}
														className="size-3.5"
													/>
													{saved ? "Saved" : "Save"}
												</Button>
											)}
										</div>
									</div>

									<div className="flex flex-col gap-4">
										{result.definitions.map((def) => (
											<div key={def.definition} className="flex flex-col gap-1">
												<span className="w-fit rounded-full bg-[--system-accent]/10 px-2 py-0.5 font-medium text-[--system-accent] text-[10px]">
													{def.partOfSpeech}
												</span>
												<p className="text-sm leading-relaxed">
													{def.definition}
												</p>
												{def.example && (
													<p className="text-muted-foreground text-xs italic">
														&ldquo;{def.example}&rdquo;
													</p>
												)}
											</div>
										))}
									</div>

									{(result.synonyms.length > 0 ||
										result.antonyms.length > 0) && (
										<div className="flex flex-col gap-2 border-t pt-4">
											{result.synonyms.length > 0 && (
												<div className="flex flex-wrap items-center gap-1.5">
													<span className="text-muted-foreground text-xs">
														Synonyms:
													</span>
													{result.synonyms.slice(0, 6).map((s) => (
														<button
															key={s}
															type="button"
															className="rounded-full bg-muted px-2 py-0.5 text-xs transition-colors hover:bg-[--system-accent]/10 hover:text-[--system-accent]"
															onClick={() => setQuery(s)}
														>
															{s}
														</button>
													))}
												</div>
											)}
											{result.antonyms.length > 0 && (
												<div className="flex flex-wrap items-center gap-1.5">
													<span className="text-muted-foreground text-xs">
														Antonyms:
													</span>
													{result.antonyms.slice(0, 6).map((a) => (
														<button
															key={a}
															type="button"
															className="rounded-full bg-muted px-2 py-0.5 text-xs transition-colors hover:bg-[--system-accent]/10 hover:text-[--system-accent]"
															onClick={() => setQuery(a)}
														>
															{a}
														</button>
													))}
												</div>
											)}
										</div>
									)}
								</CardContent>
							</Card>
						</m.div>
					)}
				</AnimatePresence>
			</div>
		</PageContainer>
	);
}
