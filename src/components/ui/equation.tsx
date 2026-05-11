"use client";

import katex from "katex";
import { useId, useMemo } from "react";

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
	errorColor = "#ef4444",
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
		<span
			className={className}
			dangerouslySetInnerHTML={{ __html: html }}
			data-equation-id={uid}
		/>
	);
}
