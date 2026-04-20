"use client";

import {
	ComputerIcon,
	Moon02Icon,
	Sun01Icon,
} from "@hugeicons/core-free-icons";

import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";

type Theme = "system" | "dark" | "light";

const themes: Theme[] = ["system", "light", "dark"];

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	const icons = {
		system: ComputerIcon,
		light: Sun01Icon,
		dark: Moon02Icon,
	};

	const labels = {
		system: "System",
		light: "Light",
		dark: "Dark",
	};

	const nextTheme = () => {
		const currentIndex = themes.indexOf(theme);
		return themes[(currentIndex + 1) % themes.length];
	};

	const handleClick = () => {
		setTheme(nextTheme());
	};

	const CurrentIcon = icons[theme];
	const currentLabel = labels[theme];

	return (
		<div className="flex items-center justify-between">
			<p className="text-sm font-medium text-foreground">{currentLabel}</p>
			<Button
				onClick={handleClick}
				className="flex items-center justify-center rounded-lg border border-border bg-card p-2 transition-colors hover:bg-accent"
				aria-label={`Current theme: ${labels[theme]}. Click to switch to ${labels[nextTheme()]}`}
			>
				<HugeiconsIcon icon={CurrentIcon} className="size-5 text-foreground" />
			</Button>
		</div>
	);
}
