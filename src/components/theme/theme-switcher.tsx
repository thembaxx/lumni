"use client";

import {
	ComputerIcon,
	Moon02Icon,
	Sun01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useTheme } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";

type Theme = "system" | "dark" | "light";

const themes: Theme[] = ["system", "light", "dark"];

const iconMap = {
	system: ComputerIcon,
	light: Sun01Icon,
	dark: Moon02Icon,
} as const;

const labels = {
	system: "System",
	light: "Light",
	dark: "Dark",
} as const;

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	const nextTheme = () => {
		const currentIndex = themes.indexOf(theme);
		return themes[(currentIndex + 1) % themes.length];
	};

	const CurrentIcon = iconMap[theme];

	return (
		<div className="flex items-center gap-3 justify-between">
			<p className="text-xs font-medium text-foreground">{labels[theme]}</p>
			<Button
				onClick={() => setTheme(nextTheme())}
				className="flex items-center justify-center rounded-lg border border-border bg-card p-2 transition-colors hover:bg-accent"
				aria-label={`Current theme: ${labels[theme]}. Click to switch to ${labels[nextTheme()]}`}
			>
				<div className="relative size-4">
					<AnimatePresence mode="popLayout" initial={false}>
						<m.div
							key={theme}
							initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
							animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
							exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
							transition={{
								type: "spring",
								duration: 0.3,
								bounce: 0,
								ease: iOSEase,
							}}
						>
							<HugeiconsIcon
								icon={CurrentIcon}
								className="size-4 text-foreground"
							/>
						</m.div>
					</AnimatePresence>
				</div>
			</Button>
		</div>
	);
}
