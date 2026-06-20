"use client";

import { m } from "framer-motion";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { usePathname } from "@/i18n/navigation";
import { iOSDecelerate } from "@/lib/utils/animation";

interface ImmersiveModeContextValue {
	isImmersive: boolean;
	setImmersive: (v: boolean) => void;
	toggleImmersive: () => void;
}

const ImmersiveModeContext = createContext<ImmersiveModeContextValue>({
	isImmersive: false,
	setImmersive: () => {},
	toggleImmersive: () => {},
});

export function ImmersiveModeProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isImmersive, setIsImmersive] = useState(false);
	const _pathname = usePathname();

	useEffect(() => {
		setIsImmersive(false);
	}, []);

	const setImmersive = useCallback((v: boolean) => {
		setIsImmersive(v);
	}, []);

	const toggleImmersive = useCallback(() => {
		setIsImmersive((prev) => !prev);
	}, []);

	const value = useMemo(
		() => ({ isImmersive, setImmersive, toggleImmersive }),
		[isImmersive, setImmersive, toggleImmersive],
	);

	return (
		<ImmersiveModeContext.Provider value={value}>
			{children}
			{isImmersive && <ExitFullscreenButton onClick={toggleImmersive} />}
		</ImmersiveModeContext.Provider>
	);
}

export function useImmersiveMode() {
	return use(ImmersiveModeContext);
}

function ExitFullscreenButton({ onClick }: { onClick: () => void }) {
	return (
		<m.button
			type="button"
			onClick={onClick}
			aria-label="Exit full-screen mode"
			className="fixed top-3 right-3 z-modal flex items-center gap-1.5 rounded-full border border-border/60 bg-system-background/95 px-3 py-1.5 font-medium text-muted-foreground text-xs shadow-level-2"
			style={{ top: `calc(0.75rem + env(safe-area-inset-top, 0px))` }}
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			transition={{ duration: 0.2, ease: iOSDecelerate }}
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<polyline points="4 14 10 14 10 20" />
				<polyline points="20 10 14 10 14 4" />
				<line x1="14" y1="10" x2="21" y2="3" />
				<line x1="3" y1="21" x2="10" y2="14" />
			</svg>
			Exit full-screen
		</m.button>
	);
}
