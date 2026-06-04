"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { SectionReveal } from "@/components/dashboard/section-reveal";

interface StaggerContextValue {
	register: () => number;
}

const StaggerContext = createContext<StaggerContextValue>({
	register: () => 0,
});

export function StaggerProvider({
	children,
	baseDelay = 0.05,
}: {
	children: ReactNode;
	baseDelay?: number;
}) {
	const counterRef = useRef(0);
	const register = () => {
		const idx = counterRef.current;
		counterRef.current += 1;
		return idx * baseDelay;
	};

	return (
		<StaggerContext.Provider value={{ register }}>
			{children}
		</StaggerContext.Provider>
	);
}

export function useStagger(): number {
	const { register } = useContext(StaggerContext);
	const delayRef = useRef<number | null>(null);
	if (delayRef.current === null) {
		delayRef.current = register();
	}
	return delayRef.current;
}

export function StaggeredSection({ children }: { children: ReactNode }) {
	const delay = useStagger();
	return <SectionReveal delay={delay}>{children}</SectionReveal>;
}
