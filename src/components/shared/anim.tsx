"use client";

import { domAnimation, LazyMotion } from "framer-motion";

export function Anim({ children }: { children: React.ReactNode }) {
	return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
