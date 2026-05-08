"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, ViewTransition } from "react";

interface PageTransitionProps {
	children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
	const pathname = usePathname();
	const [displayPathname, setDisplayPathname] = useState(pathname);

	useEffect(() => {
		if (pathname !== displayPathname) {
			setDisplayPathname(pathname);
		}
	}, [pathname, displayPathname]);

	return (
		<ViewTransition
			name="page-content"
			enter={{
				"nav-forward": "nav-forward",
				"nav-back": "nav-back",
				default: "none",
			}}
			exit={{
				"nav-forward": "nav-forward",
				"nav-back": "nav-back",
				default: "none",
			}}
			default="none"
		>
			<div key={displayPathname} className="min-h-screen">
				{children}
			</div>
		</ViewTransition>
	);
}
