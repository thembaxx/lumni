"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

type Theme = "system" | "dark" | "light";

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): Theme {
	if (typeof window === "undefined") return "dark";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("system");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const stored = localStorage.getItem("theme") as Theme | null;
		setThemeState(stored || "system");
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		localStorage.setItem("theme", theme);
	}, [theme, mounted]);

	useEffect(() => {
		if (!mounted) return;
		const root = document.documentElement;
		const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
		root.classList.remove("light", "dark");
		root.classList.add(resolvedTheme);
		root.style.colorScheme = resolvedTheme;
	}, [theme, mounted]);

	useEffect(() => {
		if (!mounted) return;
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => {
			if (theme === "system") {
				const root = document.documentElement;
				root.classList.remove("light", "dark");
				root.classList.add(getSystemTheme());
			}
		};
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, [theme, mounted]);

	const setTheme = (newTheme: Theme) => setThemeState(newTheme);

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
