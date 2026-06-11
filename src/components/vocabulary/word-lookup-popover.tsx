"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import {
	Bookmark02Icon,
	Bookmark03Icon,
	VolumeUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { lookupWord } from "@/lib/dictionary/service";
import type { DictionaryEntry } from "@/lib/dictionary/types";
import { createFlashcardFromVocabulary } from "@/lib/integration/service";
import { logError } from "@/lib/shared/logger";
import { isWordSaved, removeWord, saveWord } from "@/lib/vocabulary/service";

interface WordLookupPopoverProps {
	word: string;
	language?: string;
	userId?: string;
	children: React.ReactNode;
}

export function WordLookupPopover({
	word,
	language = "en",
	userId = "anonymous",
	children,
}: WordLookupPopoverProps) {
	const [open, setOpen] = useState(false);
	const [results, setResults] = useState<DictionaryEntry[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [saved, setSaved] = useState(false);
	const [saving, setSaving] = useState(false);

	const entry = results?.[0];

	const handleOpenChange = useCallback(
		async (isOpen: boolean) => {
			setOpen(isOpen);
			if (isOpen && results === null) {
				setLoading(true);
				try {
					const data = await lookupWord(word, language);
					setResults(data);
					const alreadySaved = await isWordSaved(userId, word);
					setSaved(alreadySaved);
				} catch (err) {
					logError("WordLookupPopover.lookup", err);
					setResults([]);
				} finally {
					setLoading(false);
				}
			}
		},
		[word, language, userId, results],
	);

	const playAudio = useCallback((url?: string) => {
		if (!url) return;
		const audio = new Audio(url);
		void audio.play();
	}, []);

	const handleSave = useCallback(async () => {
		if (saving) return;
		setSaving(true);
		try {
			if (saved) {
				await removeWord(userId, word);
				setSaved(false);
			} else {
				const def = entry?.meanings[0]?.definitions[0]?.definition ?? "";
				const pos = entry?.meanings[0]?.partOfSpeech;
				await saveWord(
					userId,
					word,
					def,
					language,
					"manual",
					"dictionary",
					pos,
				);
				await createFlashcardFromVocabulary(userId, word, def, language);
				setSaved(true);
			}
		} catch (err) {
			logError("WordLookupPopover.save", err);
		} finally {
			setSaving(false);
		}
	}, [saving, saved, userId, word, language, entry]);

	return (
		<PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
			<PopoverPrimitive.Trigger
				render={
					<span className="cursor-pointer underline decoration-dotted underline-offset-2 transition-colors hover:text-[--system-accent]">
						{children}
					</span>
				}
			/>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Positioner>
					<PopoverPrimitive.Popup className="z-drawer w-72 rounded-xl border bg-popover p-4 text-popover-foreground shadow-md outline-none">
						<div className="flex flex-col gap-2">
							{loading ? (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									Looking up...
								</div>
							) : entry ? (
								<>
									<div className="flex items-center gap-2">
										<span className="font-extrabold text-base">
											{entry.word}
										</span>
										{entry.phonetic && (
											<span className="text-muted-foreground text-xs">
												{entry.phonetic}
											</span>
										)}
										{entry.audio && (
											<Button
												variant="ghost"
												size="icon"
												className="ml-auto size-7 shrink-0 rounded-full"
												onClick={() => playAudio(entry.audio)}
												aria-label={`Listen to ${entry.word}`}
											>
												<HugeiconsIcon
													icon={VolumeUpIcon}
													className="size-3.5"
												/>
											</Button>
										)}
									</div>
									{entry.origin && (
										<Badge
											variant="secondary"
											className="w-fit rounded-full text-[10px]"
										>
											{entry.origin}
										</Badge>
									)}
									{entry.meanings.slice(0, 2).map((meaning) => (
										<div
											key={meaning.partOfSpeech}
											className="flex flex-col gap-1"
										>
											<span className="w-fit rounded-full bg-[--system-accent]/10 px-2 py-0.5 font-medium text-[--system-accent] text-[10px]">
												{meaning.partOfSpeech}
											</span>
											<p className="text-sm leading-relaxed">
												{meaning.definitions[0]?.definition ?? "—"}
											</p>
											{meaning.definitions[0]?.example && (
												<p className="text-muted-foreground text-xs italic">
													&ldquo;{meaning.definitions[0].example}&rdquo;
												</p>
											)}
										</div>
									))}
									<Button
										variant={saved ? "default" : "outline"}
										size="sm"
										className="mt-1 w-full rounded-full text-xs"
										onClick={handleSave}
										disabled={saving}
									>
										<HugeiconsIcon
											icon={saved ? Bookmark03Icon : Bookmark02Icon}
											className="size-3.5"
										/>
										{saved ? "Saved for Review" : "Save & Review"}
									</Button>
								</>
							) : (
								<p className="text-muted-foreground text-sm">
									No definition found for &ldquo;{word}&rdquo;
								</p>
							)}
						</div>
					</PopoverPrimitive.Popup>
				</PopoverPrimitive.Positioner>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
