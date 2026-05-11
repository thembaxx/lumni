"use client";

import { domAnimation, LazyMotion, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface PageTransitionProps {
	children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
	const pathname = usePathname();
	const [displayPathname, setDisplayPathname] = useState(pathname);
	const [direction, setDirection] = useState<"forward" | "back">("forward");

	useEffect(() => {
		if (pathname !== displayPathname) {
			setDirection("forward");
			setDisplayPathname(pathname);
		}
	}, [pathname, displayPathname]);

	const iOSEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

	return (
		<LazyMotion features={domAnimation}>
			<m.div
				key={displayPathname}
				className="min-h-screen"
				initial={{
					opacity: 0,
					x: direction === "forward" ? 60 : -60,
				}}
				animate={{
					opacity: 1,
					x: 0,
					transition: {
						duration: 0.25,
						ease: iOSEase,
					},
				}}
				exit={{
					opacity: 0,
					x: direction === "forward" ? -60 : 60,
					transition: {
						duration: 0.18,
						ease: iOSEase,
					},
				}}
			>
				{children}
			</m.div>
		</LazyMotion>
	);
}
