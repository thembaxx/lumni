"use client";

import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeSwitcher } from "@/components/theme";
import { ListCell, ListSection } from "@/components/ui/list-cell";

const themeSwitcher = <ThemeSwitcher />;
const localeSwitcher = <LocaleSwitcher />;

export function AppearanceTab() {
  const t = useTranslations();

  return (
    <ListSection header={t("settings.appearance")} footer={t("settings.languageDescription")}>
      <ListCell
        title={t("settings.theme")}
        subtitle={t("settings.appearance")}
        trailing={themeSwitcher}
      />
      <ListCell
        title={t("common.language")}
        subtitle={t("settings.languageDescription")}
        trailing={localeSwitcher}
      />
    </ListSection>
  );
}
