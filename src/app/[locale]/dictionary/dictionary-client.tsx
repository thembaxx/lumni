"use client";

import { Search01Icon, VolumeUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lookupWord } from "@/lib/dictionary";
import type { DictionaryEntry } from "@/lib/dictionary/types";
import { logError } from "@/lib/shared/logger";

export function DictionaryClient() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<DictionaryEntry[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [searched, setSearched] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSearch = useCallback(async () => {
		const word = query.trim();
		if (!word) return;
		setLoading(true);
		setSearched(true);
		try {
			const data = await lookupWord(word);
			setResults(data);
		} catch (err) {
			logError("DictionaryClient.search", err);
			setResults([]);
		} finally {
			setLoading(false);
		}
	}, [query]);

	const playAudio = useCallback((url?: string) => {
		if (!url) return;
		const audio = new Audio(url);
		void audio.play();
	}, []);

	return (
		<PageContainer className="gap-6 pt-8">
			<div className="flex flex-col gap-2">
				<h1 className="font-extrabold text-2xl tracking-tight">Dictionary</h1>
				<p className="text-muted-foreground text-sm">
					Look up definitions, pronunciations, and examples
				</p>
			</div>

			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<HugeiconsIcon
						icon={Search01Icon}
						className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						ref={inputRef}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search for a word..."
						className="h-12 rounded-full pl-12 text-base"
						aria-label="Search for a word"
					/>
				</div>
				<Button
					type="button"
					disabled={loading || !query.trim()}
					onClick={handleSearch}
					className="h-12 rounded-full px-6"
				>
					{loading ? "Searching..." : "Search"}
				</Button>
			</div>

			{!searched && (
				<div className="flex flex-col items-center gap-3 py-16 text-center">
					<HugeiconsIcon
						icon={Search01Icon}
						className="size-12 text-muted-foreground/30"
					/>
					<p className="text-muted-foreground text-sm">
						Enter a word to see its definition
					</p>
				</div>
			)}

			{searched && !loading && results?.length === 0 && (
				<div className="flex flex-col items-center gap-3 py-16 text-center">
					<p className="font-semibold text-lg">No results found</p>
					<p className="text-muted-foreground text-sm">
						Try checking the spelling or searching for a different word
					</p>
				</div>
			)}

			{results?.map((entry) => (
				<m.div
					key={entry.word}
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
				>
					<Card className="overflow-hidden rounded-3xl shadow-level-1">
						<CardContent className="flex flex-col gap-5 p-6">
							<div className="flex items-center gap-3">
								<div className="flex flex-col">
									<span className="font-extrabold text-2xl tracking-tight">
										{entry.word}
									</span>
									{entry.phonetic && (
										<span className="text-muted-foreground text-sm">
											{entry.phonetic}
										</span>
									)}
								</div>
								{entry.audio && (
									<Button
										variant="ghost"
										size="icon"
										className="size-10 rounded-full"
										onClick={() => playAudio(entry.audio)}
										aria-label={`Listen to pronunciation of ${entry.word}`}
									>
										<HugeiconsIcon icon={VolumeUpIcon} className="size-5" />
									</Button>
								)}
								{entry.origin && (
									<Badge
										variant="secondary"
										className="ml-auto rounded-full text-xs"
									>
										{entry.origin}
									</Badge>
								)}
							</div>

							{entry.meanings.map((meaning) => (
								<div
									key={`${meaning.partOfSpeech}-${meaning.definitions[0]?.definition.slice(0, 20)}`}
									className="flex flex-col gap-3"
								>
									<div className="flex items-center gap-2">
										<span className="rounded-full bg-[--system-accent]/10 px-3 py-0.5 font-medium text-[--system-accent] text-xs">
											{meaning.partOfSpeech}
										</span>
									</div>
									<div className="flex flex-col gap-3">
										{meaning.definitions.map((def, di) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: static definitions, no stable id
											<div key={di} className="flex flex-col gap-1">
												<p className="leading-relaxed">
													{di + 1}. {def.definition}
												</p>
												{def.example && (
													<p className="text-muted-foreground text-sm italic">
														&ldquo;{def.example}&rdquo;
													</p>
												)}
												{def.synonyms.length > 0 && (
													<div className="flex flex-wrap items-center gap-1.5">
														<span className="text-muted-foreground text-xs">
															Synonyms:
														</span>
														{def.synonyms.slice(0, 5).map((syn) => (
															<Badge
																key={syn}
																variant="outline"
																className="cursor-pointer rounded-full text-xs hover:bg-muted"
																onClick={() => {
																	setQuery(syn);
																	void lookupWord(syn).then(setResults);
																}}
															>
																{syn}
															</Badge>
														))}
													</div>
												)}
												{def.antonyms.length > 0 && (
													<div className="flex flex-wrap items-center gap-1.5">
														<span className="text-muted-foreground text-xs">
															Antonyms:
														</span>
														{def.antonyms.slice(0, 5).map((ant) => (
															<Badge
																key={ant}
																variant="outline"
																className="cursor-pointer rounded-full text-xs hover:bg-muted"
															>
																{ant}
															</Badge>
														))}
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</m.div>
			))}
		</PageContainer>
	);
}
