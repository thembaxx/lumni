"use client";

import { NextIntlClientProvider } from "next-intl";
import type { Locale } from "@/i18n/locales";

interface I18nProviderProps {
	locale: Locale;
	messages: Record<string, unknown>;
	timeZone: string;
	children: React.ReactNode;
}

export function I18nProvider({
	locale,
	messages,
	timeZone,
	children,
}: I18nProviderProps) {
	return (
		<NextIntlClientProvider
			locale={locale}
			messages={messages}
			timeZone={timeZone}
		>
			{children}
		</NextIntlClientProvider>
	);
}
