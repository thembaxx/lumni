"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface LazySyntaxHighlighterProps {
	language: string;
	children: ReactNode;
}

function LazySyntaxHighlighter({
	language,
	children,
}: LazySyntaxHighlighterProps) {
	const ref = useRef<{
		SyntaxHighlighter: React.ComponentType<Record<string, unknown>>;
		style: Record<string, unknown>;
	} | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let cancelled = false;
		Promise.all([
			import("react-syntax-highlighter"),
			import("react-syntax-highlighter/dist/esm/styles/prism"),
		])
			.then(([highlighterMod, styleMod]) => {
				if (cancelled) return;
				type HighlighterMod = {
					Prism: React.ComponentType<Record<string, unknown>>;
				};
				type StyleMod = { oneLight: Record<string, unknown> };
				ref.current = {
					SyntaxHighlighter: (highlighterMod as unknown as HighlighterMod)
						.Prism,
					style: (styleMod as unknown as StyleMod).oneLight,
				};
				setLoaded(true);
			})
			.catch((error) => {
				if (cancelled) return;
				console.error("Failed to load syntax highlighter:", error);
				setLoaded(true);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	if (!loaded || !ref.current) {
		return (
			<pre className="m-0 max-h-[200px] overflow-auto bg-muted p-3 text-xs">
				<code>{children}</code>
			</pre>
		);
	}

	const { SyntaxHighlighter, style } = ref.current;
	return (
		<SyntaxHighlighter
			language={language}
			style={style}
			customStyle={{ margin: 0, fontSize: "0.8rem", maxHeight: 200 }}
		>
			{children}
		</SyntaxHighlighter>
	);
}

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/shared";

interface ProgrammingInputProps {
	value?: string | undefined;
	onChange?: (value: string) => void;
	language?: string;
	starterCode?: string;
	disabled?: boolean;
	onSubmit?: (value: string) => void;
}

export function ProgrammingInput({
	value = "",
	onChange = () => {},
	language = "delphi",
	starterCode,
	disabled,
	onSubmit,
}: ProgrammingInputProps) {
	return (
		<div className="flex flex-col gap-3">
			{starterCode && (
				<div className="overflow-hidden rounded border">
					<div className="bg-muted px-3 py-1 font-medium text-muted-foreground text-xs">
						Starter Code ({language})
					</div>
					<LazySyntaxHighlighter language={language}>
						{starterCode}
					</LazySyntaxHighlighter>
				</div>
			)}
			<Label htmlFor="programming-input">Your solution ({language})</Label>
			<Textarea
				id="programming-input"
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
				}}
				disabled={disabled}
				placeholder={`Write your ${language} code here...`}
				className={cn("min-h-[150px] font-mono text-sm", starterCode && "mt-2")}
			/>
			{onSubmit && (
				<Button
					onClick={() => onSubmit(value.trim())}
					disabled={disabled || !value.trim()}
					size="sm"
				>
					Submit Answer
				</Button>
			)}
		</div>
	);
}
