"use client";

import katex from "katex";
import { useId, useMemo } from "react";
import { KatexCSS } from "@/components/katex-css";

interface EquationProps {
	math: string;
	block?: boolean;
	className?: string;
	errorColor?: string;
}

export function Equation({
	math,
	block = false,
	className,
	errorColor = "oklch(59.3% 0.194 28°)",
}: EquationProps) {
	const uid = useId();

	const html = useMemo(() => {
		try {
			return katex.renderToString(math, {
				displayMode: block,
				throwOnError: false,
				errorColor,
			});
		} catch {
			return `<span style="color:${errorColor}">${math}</span>`;
		}
	}, [math, block, errorColor]);

	return (
		<>
			<KatexCSS />
			<span
				className={className}
				dangerouslySetInnerHTML={{ __html: html }}
				data-equation-id={uid}
			/>
		</>
	);
}
