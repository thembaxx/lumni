"use client";

import { useCallback, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { localeLabels, locales } from "@/i18n/locales";
import { useI18nContext } from "./i18n-provider";

export function LocaleSwitcher() {
	const { locale, setLocale } = useI18nContext();
	const [open, setOpen] = useState(false);

	const handleSelect = useCallback(
		(next: Locale) => {
			setLocale(next);
			setOpen(false);
		},
		[setLocale],
	);

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-[--system-text-secondary] text-sm transition-colors hover:bg-[--system-surface-hover] hover:text-[--system-text-primary]"
			>
				<span className="text-base">{locale === "af" ? "🇿🇦" : "🇬🇧"}</span>
				<span>{localeLabels[locale]}</span>
			</button>
			{open && (
				<>
					<button
						type="button"
						className="fixed inset-0 z-10"
						onClick={() => setOpen(false)}
						aria-label="Close"
					/>
					<div className="absolute top-full right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-[--system-border] bg-[--system-surface-elevated] shadow-level-2">
						{locales.map((l) => (
							<button
								key={l}
								type="button"
								onClick={() => handleSelect(l)}
								className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[--system-surface-hover] ${
									l === locale
										? "font-semibold text-[--system-accent]"
										: "text-[--system-text-primary]"
								}`}
							>
								<span>{l === "af" ? "🇿🇦" : "🇬🇧"}</span>
								<span>{localeLabels[l]}</span>
								{l === locale && <span className="ml-auto">✓</span>}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
