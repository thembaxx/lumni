"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GlobeIcon } from "@hugeicons/core-free-icons";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SA_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇿🇦" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu", flag: "🇿🇦" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa", flag: "🇿🇦" },
  { code: "st", name: "Sotho", nativeName: "Sesotho", flag: "🇿🇦" },
  { code: "tn", name: "Tswana", nativeName: "Setswana", flag: "🇿🇦" },
  { code: "nso", name: "Northern Sotho", nativeName: "Sesotho sa Leboa", flag: "🇿🇦" },
  { code: "ts", name: "Tsonga", nativeName: "Xitsonga", flag: "🇿🇦" },
  { code: "ss", name: "Swati", nativeName: "siSwati", flag: "🇿🇦" },
  { code: "ve", name: "Venda", nativeName: "Tshivenda", flag: "🇿🇦" },
  { code: "nd", name: "Ndebele", nativeName: "isiNdebele", flag: "🇿🇦" },
];

export function LanguageSelector({
  value,
  onChange,
  label = "Language",
  className = "",
  showFlag = true,
}: {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  className?: string;
  showFlag?: boolean;
}) {
  const t = useTranslations("common");

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="language-select" className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
      >
        {SA_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {showFlag ? `${lang.flag} ` : ""}
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LanguageBadge({ code, className = "" }: { code: string; className?: string }) {
  const lang = SA_LANGUAGES.find((l) => l.code === code);
  if (!lang) return <span className={className}>{code.toUpperCase()}</span>;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 ${className}`}
    >
      {lang.flag} {lang.nativeName}
    </span>
  );
}

export function useLanguage() {
  const [language, setLanguage] = useState("en");

  const setLanguageSafe = (code: string) => {
    if (SA_LANGUAGES.some((l) => l.code === code)) {
      setLanguage(code);
      localStorage.setItem("lumni_language", code);
    }
  };

  return { language, setLanguage: setLanguageSafe };
}
