"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import { KatexCSS } from "@/components/katex-css";

interface EquationProps {
	math: string;
	block?: boolean;
	className?: string;
	errorColor?: string;
}

export const Equation = memo(function Equation({
	math,
	block = false,
	className,
	errorColor = "oklch(59.3% 0.194 28°)",
}: EquationProps) {
	const uid = useId();
	const [html, setHtml] = useState("");
	const mounted = useRef(true);

	useEffect(() => {
		mounted.current = true;
		let cancelled = false;

		import("katex").then((mod) => {
			if (cancelled || !mounted.current) return;
			try {
				const result = mod.default.renderToString(math, {
					displayMode: block,
					throwOnError: false,
					errorColor,
				});
				setHtml(result);
			} catch {
				setHtml(`<span style="color:${errorColor}">${math}</span>`);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [math, block, errorColor]);

	return (
		<>
			<KatexCSS />
			{html ? (
				<span
					className={className}
					dangerouslySetInnerHTML={{ __html: html }}
					data-equation-id={uid}
				/>
			) : (
				<span className={className} data-equation-id={uid}>
					{math}
				</span>
			)}
		</>
	);
});
