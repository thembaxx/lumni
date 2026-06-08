"use client";

import {
	createContext,
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
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
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window !== "undefined") {
			try {
				return (localStorage.getItem("theme") as Theme) || "system";
			} catch {
				return "system";
			}
		}
		return "system";
	});
	const mounted = useRef(false);

	useEffect(() => {
		mounted.current = true;
	}, []);

	useEffect(() => {
		if (!mounted.current) return;
		try {
			localStorage.setItem("theme", theme);
			// biome-ignore lint/suspicious/noDocumentCookie: Cookie needed for server-side theme detection
			document.cookie = `theme=${theme};path=/;max-age=31536000;SameSite=Lax`;
		} catch {
			// Storage unavailable; theme still applies in-memory
		}
		const root = document.documentElement;
		const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
		root.classList.remove("light", "dark");
		root.classList.add(resolvedTheme);
		root.style.colorScheme = resolvedTheme;

		// Sync theme-color meta tag with resolved background
		const bg = getComputedStyle(root)
			.getPropertyValue("--system-background")
			.trim();
		let meta = document.querySelector<HTMLMetaElement>(
			'meta[name="theme-color"]',
		);
		if (!meta) {
			meta = document.createElement("meta");
			meta.name = "theme-color";
			document.head.appendChild(meta);
		}
		meta.content = bg || (resolvedTheme === "dark" ? "#14141f" : "#fcfaf5");
	}, [theme]);

	useEffect(() => {
		if (!mounted.current) return;
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
	}, [theme]);

	const setTheme = useCallback(
		(newTheme: Theme) => setThemeState(newTheme),
		[],
	);

	return (
		<ThemeContext.Provider
			value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = use(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
