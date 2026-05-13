"use client";

import { m } from "framer-motion";
import { Anim } from "@/components/shared/anim";
import { createContext, useContext, useState } from "react";
import { easeOutQuint, iOSEase } from "@/lib/utils/animation";

interface DirectionalTransitionContextValue {
	direction: "forward" | "back";
	setDirection: (dir: "forward" | "back") => void;
}

const DirectionalTransitionContext =
	createContext<DirectionalTransitionContextValue>({
		direction: "forward",
		setDirection: () => {},
	});

export function useDirectionalTransition() {
	return useContext(DirectionalTransitionContext);
}

interface DirectionalTransitionProviderProps {
	children: React.ReactNode;
}

export function DirectionalTransitionProvider({
	children,
}: DirectionalTransitionProviderProps) {
	const [direction, setDirection] = useState<"forward" | "back">("forward");
	return (
		<DirectionalTransitionContext.Provider value={{ direction, setDirection }}>
			{children}
		</DirectionalTransitionContext.Provider>
	);
}

interface DirectionalTransitionProps {
	children: React.ReactNode;
	direction?: "forward" | "back";
}

export function DirectionalTransition({
	children,
	direction = "forward",
}: DirectionalTransitionProps) {
	const xOffset = direction === "forward" ? 40 : -40;

	return (
		<Anim>
			<m.div
				initial={{ opacity: 0, x: xOffset }}
				animate={{
					opacity: 1,
					x: 0,
					transition: {
						duration: 0.3,
						delay: 0.08,
						ease: iOSEase,
					},
				}}
				exit={{
					opacity: 0,
					x: -xOffset,
					transition: {
						duration: 0.2,
						ease: iOSEase,
					},
				}}
			>
				{children}
			</m.div>
		</Anim>
	);
}
