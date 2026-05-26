"use client";

import { useParams } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { createContext, useContext } from "react";
import type { Locale } from "@/i18n/locales";
import { isValidLocale } from "@/i18n/locales";

interface I18nContextValue {
	setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const params = useParams<{ locale?: string }>();
	const localeFromPath =
		params?.locale && isValidLocale(params.locale) ? params.locale : "en";

	return (
		<NextIntlClientProvider locale={localeFromPath}>
			<I18nContext.Provider value={{ setLocale: () => {} }}>
				{children}
			</I18nContext.Provider>
		</NextIntlClientProvider>
	);
}

export function useI18nContext() {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error("useI18nContext must be used within I18nProvider");
	return ctx;
}
