"use client";

import { NextIntlClientProvider } from "next-intl";
import type { Locale } from "@/i18n/locales";

interface I18nProviderProps {
	locale: Locale;
	messages: Record<string, unknown>;
	children: React.ReactNode;
}

export function I18nProvider({
	locale,
	messages,
	children,
}: I18nProviderProps) {
	return (
		<NextIntlClientProvider locale={locale} messages={messages}>
			{children}
		</NextIntlClientProvider>
	);
}
