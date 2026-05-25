"use client";

import { NextIntlClientProvider } from "next-intl";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { Locale } from "@/i18n/locales";
import { defaultLocale, isValidLocale } from "@/i18n/locales";

type Messages = Record<string, unknown>;

interface I18nContextValue {
	locale: Locale;
	setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "lumni-locale";

function getInitialLocale(): Locale {
	if (typeof window === "undefined") return defaultLocale;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && isValidLocale(stored)) return stored;
	return defaultLocale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(defaultLocale);
	const [messages, setMessages] = useState<Messages | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const initial = getInitialLocale();
		setLocaleState(initial);
		loadMessages(initial).then((msgs) => {
			setMessages(msgs);
			setReady(true);
		});
	}, []);

	const setLocale = useCallback((next: Locale) => {
		setLocaleState(next);
		localStorage.setItem(STORAGE_KEY, next);
		loadMessages(next).then(setMessages);
	}, []);

	if (!ready || !messages) {
		return <>{children}</>;
	}

	return (
		<I18nContext.Provider value={{ locale, setLocale }}>
			<NextIntlClientProvider locale={locale} messages={messages}>
				{children}
			</NextIntlClientProvider>
		</I18nContext.Provider>
	);
}

async function loadMessages(locale: Locale): Promise<Messages> {
	try {
		return (await import(`../../../messages/${locale}.json`)) as Messages;
	} catch {
		return (await import(
			`../../../messages/${defaultLocale}.json`
		)) as Messages;
	}
}

export function useI18nContext() {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error("useI18nContext must be used within I18nProvider");
	return ctx;
}
