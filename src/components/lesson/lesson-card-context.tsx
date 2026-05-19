"use client";

import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useContext,
	useState,
} from "react";

interface LessonCardContextValue {
	openId: string | null;
	setOpenId: Dispatch<SetStateAction<string | null>>;
	isOpen: (id: string) => boolean;
}

const LessonCardContext = createContext<LessonCardContextValue | null>(null);

export function LessonCardProvider({ children }: { children: ReactNode }) {
	const [openId, setOpenId] = useState<string | null>(null);

	const isOpen = (id: string) => openId === id;

	return (
		<LessonCardContext.Provider value={{ openId, setOpenId, isOpen }}>
			{children}
		</LessonCardContext.Provider>
	);
}

export function useLessonCardContext() {
	const context = useContext(LessonCardContext);
	if (!context) {
		throw new Error(
			"useLessonCardContext must be used within LessonCardProvider",
		);
	}
	return context;
}
