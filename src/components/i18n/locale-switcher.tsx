"use client";

import { useLocale } from "next-intl";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/i18n/locales";
import { localeLabels, locales } from "@/i18n/locales";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSelect = useCallback(
    (next: Locale | null) => {
      if (next) replace(pathname, { locale: next });
    },
    [pathname, replace],
  );

  return (
    <Select value={locale} onValueChange={handleSelect}>
      <SelectTrigger className="h-9 gap-2 border-none bg-transparent px-3 py-2 focus:ring-0">
        <span className="text-base">🌐</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="w-48">
        {locales.map((l) => (
          <SelectItem key={l} value={l}>
            {localeLabels[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
