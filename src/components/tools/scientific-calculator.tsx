"use client";

import { Clock, ClockCounterClockwise, Copy } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/shared";

type AngleMode = "deg" | "rad";

interface CalcState {
	expression: string;
	result: string;
	memory: number;
	memorySet: boolean;
	angleMode: AngleMode;
	showHistory: boolean;
	error: boolean;
}

function factorial(n: number): number {
	if (n < 0 || !Number.isInteger(n)) return NaN;
	if (n <= 1) return 1;
	let r = 1;
	for (let i = 2; i <= n; i++) r *= i;
	return r;
}

function safeEval(expr: string, angleMode: AngleMode): number {
	const _toRad = (x: number) => (angleMode === "deg" ? (x * Math.PI) / 180 : x);
	const prepared = expr
		.replace(/×/g, "*")
		.replace(/÷/g, "/")
		.replace(/−/g, "-")
		.replace(/π/g, `(${Math.PI})`)
		.replace(/(?<![a-zA-Z])e(?![a-zA-Z(])/g, `(${Math.E})`)
		.replace(/²/g, "**2")
		.replace(/³/g, "**3")
		.replace(/sin⁻¹\(/g, "Math.asin(")
		.replace(/cos⁻¹\(/g, "Math.acos(")
		.replace(/tan⁻¹\(/g, "Math.atan(")
		.replace(/sin\(/g, "Math.sin(")
		.replace(/cos\(/g, "Math.cos(")
		.replace(/tan\(/g, "Math.tan(")
		.replace(/log\(/g, "Math.log10(")
		.replace(/ln\(/g, "Math.log(")
		.replace(/√\(/g, "Math.sqrt(")
		.replace(/∛\(/g, "Math.cbrt(")
		.replace(/mod\s+/gi, "%")
		.replace(/!/g, "*factorial(");
	const sanitized = prepared.replace(
		/[^0-9+\-*/().,%\s]|Math\.\w+|factorial/g,
		(m) => m,
	);
	const allowed = /^[\d+\-*/().,%\s]+$/;
	if (
		!allowed.test(sanitized.replace(/Math\.\w+/g, "").replace(/factorial/g, ""))
	) {
		throw new Error("Invalid expression");
	}
	const fn = new Function("factorial", `"use strict"; return (${sanitized})`);
	return fn(factorial);
}

interface CalcButton {
	id: string;
	label: string;
	variant: "default" | "secondary" | "ghost" | "destructive";
	span?: 2;
}

const ROWS: CalcButton[][] = [
	[
		{ id: "(", label: "(", variant: "ghost" },
		{ id: ")", label: ")", variant: "ghost" },
		{ id: "mc", label: "MC", variant: "ghost" },
		{ id: "mr", label: "MR", variant: "ghost" },
		{ id: "m+", label: "M+", variant: "ghost" },
		{ id: "m-", label: "M-", variant: "ghost" },
	],
	[
		{ id: "x²", label: "x²", variant: "ghost" },
		{ id: "x³", label: "x³", variant: "ghost" },
		{ id: "√(", label: "√(", variant: "ghost" },
		{ id: "∛(", label: "∛(", variant: "ghost" },
		{ id: "^", label: "^", variant: "ghost" },
		{ id: "!", label: "n!", variant: "ghost" },
	],
	[
		{ id: "sin(", label: "sin(", variant: "ghost" },
		{ id: "cos(", label: "cos(", variant: "ghost" },
		{ id: "tan(", label: "tan(", variant: "ghost" },
		{ id: "log(", label: "log(", variant: "ghost" },
		{ id: "ln(", label: "ln(", variant: "ghost" },
		{ id: "1/x", label: "1/x", variant: "ghost" },
	],
	[
		{ id: "sin⁻¹(", label: "sin⁻¹(", variant: "ghost" },
		{ id: "cos⁻¹(", label: "cos⁻¹(", variant: "ghost" },
		{ id: "tan⁻¹(", label: "tan⁻¹(", variant: "ghost" },
		{ id: "mod", label: "mod", variant: "ghost" },
		{ id: "π", label: "π", variant: "ghost" },
		{ id: "e", label: "e", variant: "ghost" },
	],
	[
		{ id: "7", label: "7", variant: "default" },
		{ id: "8", label: "8", variant: "default" },
		{ id: "9", label: "9", variant: "default" },
		{ id: "del", label: "⌫", variant: "secondary" },
		{ id: "clear", label: "CE", variant: "destructive" },
	],
	[
		{ id: "4", label: "4", variant: "default" },
		{ id: "5", label: "5", variant: "default" },
		{ id: "6", label: "6", variant: "default" },
		{ id: "÷", label: "÷", variant: "secondary" },
		{ id: "×", label: "×", variant: "secondary" },
	],
	[
		{ id: "1", label: "1", variant: "default" },
		{ id: "2", label: "2", variant: "default" },
		{ id: "3", label: "3", variant: "default" },
		{ id: "−", label: "−", variant: "secondary" },
		{ id: "+", label: "+", variant: "secondary" },
	],
	[
		{ id: "±", label: "±", variant: "ghost" },
		{ id: "0", label: "0", variant: "default" },
		{ id: ".", label: ".", variant: "default" },
		{ id: "ans", label: "Ans", variant: "ghost" },
		{ id: "=", label: "=", variant: "secondary" },
	],
];

const VARIANT_CLASSES: Record<string, string> = {
	default: "bg-system-fill hover:bg-system-fill-secondary text-foreground",
	secondary:
		"bg-[--system-accent]/10 text-[--system-accent] hover:bg-[--system-accent]/20",
	ghost: "text-[--system-text-secondary] hover:bg-system-fill",
	destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
};

export function ScientificCalculator() {
	const [state, setState] = useState<CalcState>({
		expression: "",
		result: "0",
		memory: 0,
		memorySet: false,
		angleMode: "deg",
		showHistory: false,
		error: false,
	});
	const [history, setHistory] = useState<string[]>([]);
	const [lastResult, setLastResult] = useState<number | null>(null);

	const evaluateExpression = useCallback(
		(expr: string): string => {
			try {
				const result = safeEval(expr, state.angleMode);
				if (!Number.isFinite(result)) return "Error";
				const str =
					Math.abs(result) > 1e12 || (Math.abs(result) < 1e-10 && result !== 0)
						? result.toExponential(6)
						: String(parseFloat(result.toPrecision(10)));
				return str;
			} catch {
				return "Error";
			}
		},
		[state.angleMode],
	);

	const appendToExpr = useCallback(
		(value: string) => {
			setState((prev) => {
				const updated = prev.expression + value;
				const result = evaluateExpression(updated);
				return {
					...prev,
					expression: updated,
					result,
					error: result === "Error",
				};
			});
		},
		[evaluateExpression],
	);

	const handleButton = useCallback(
		(id: string) => {
			switch (id) {
				case "clear":
					setState((prev) => ({
						...prev,
						expression: "",
						result: "0",
						error: false,
					}));
					break;
				case "del":
					setState((prev) => {
						const updated = prev.expression.slice(0, -1);
						const result = evaluateExpression(updated || "0");
						return {
							...prev,
							expression: updated,
							result: updated ? result : "0",
							error: result === "Error",
						};
					});
					break;
				case "=":
					setState((prev) => {
						if (!prev.expression || prev.result === "Error") return prev;
						const entry = `${prev.expression} = ${prev.result}`;
						setHistory((h) => [entry, ...h].slice(0, 50));
						setLastResult(Number.parseFloat(prev.result));
						return { ...prev, expression: prev.result, result: prev.result };
					});
					break;
				case "±":
					setState((prev) => {
						const updated = prev.expression.startsWith("-")
							? prev.expression.slice(1)
							: `-(${prev.expression || "0"})`;
						const result = evaluateExpression(updated);
						return {
							...prev,
							expression: updated,
							result,
							error: result === "Error",
						};
					});
					break;
				case "1/x":
					setState((prev) => {
						const updated = `1/(${prev.expression || "0"})`;
						const result = evaluateExpression(updated);
						return {
							...prev,
							expression: updated,
							result,
							error: result === "Error",
						};
					});
					break;
				case "mc":
					setState((prev) => ({ ...prev, memory: 0, memorySet: false }));
					break;
				case "mr":
					appendToExpr(String(state.memory));
					break;
				case "m+":
					setState((prev) => ({
						...prev,
						memory: prev.memory + Number.parseFloat(prev.result || "0"),
						memorySet: true,
					}));
					break;
				case "m-":
					setState((prev) => ({
						...prev,
						memory: prev.memory - Number.parseFloat(prev.result || "0"),
						memorySet: true,
					}));
					break;
				case "ans":
					if (lastResult !== null) appendToExpr(String(lastResult));
					break;
				default:
					appendToExpr(id);
			}
		},
		[appendToExpr, evaluateExpression, state.memory, lastResult],
	);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(state.result).then(() => {
			toast({ type: "success", message: "Copied to clipboard!" });
		});
	}, [state.result]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const key = e.key;
			if (key === "Enter") handleButton("=");
			else if (key === "Backspace") handleButton("del");
			else if (key === "Escape") handleButton("clear");
			else if (/^[\d.+\-*/^()]$/.test(key)) appendToExpr(key);
		},
		[handleButton, appendToExpr],
	);

	const toggleAngle = useCallback(() => {
		setState((prev) => ({
			...prev,
			angleMode: prev.angleMode === "deg" ? "rad" : "deg",
		}));
	}, []);

	const toggleHistory = useCallback(() => {
		setState((prev) => ({ ...prev, showHistory: !prev.showHistory }));
	}, []);

	return (
		<div
			className="h-full flex flex-col overflow-y-auto"
			onKeyDown={handleKeyDown}
		>
			<div className="px-6 pt-5 pb-3">
				<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
					Scientific Calculator
				</h2>
				<p className="ios-subhead text-[--system-text-secondary]/60 mt-1.5">
					{state.angleMode === "deg" ? "Degrees" : "Radians"}
					{state.memorySet && " · Memory stored"}
				</p>
			</div>

			<div className="px-5 pb-5 flex-1">
				<div className="bg-system-background-secondary rounded-2xl p-5 h-full flex flex-col">
					<div className="bg-system-surface rounded-xl p-4 border border-border/50 mb-4 min-h-[88px] flex flex-col justify-end">
						<div className="text-right text-xs text-muted-foreground/60 font-mono truncate mb-1 select-all">
							{state.expression || "0"}
						</div>
						<div className="flex items-center justify-between gap-2">
							<button
								type="button"
								onClick={handleCopy}
								className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
							>
								<Copy className="size-3.5" data-icon />
							</button>
							<span
								className={cn(
									"text-2xl font-mono font-semibold tracking-tight select-all",
									state.error
										? "text-destructive"
										: "text-[--system-text-primary]",
								)}
							>
								{state.result}
							</span>
						</div>
					</div>

					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-1.5">
							<Button
								variant={state.angleMode === "deg" ? "default" : "ghost"}
								size="xs"
								onClick={toggleAngle}
								className="text-xs h-7 px-2.5 rounded-lg font-mono"
							>
								DEG
							</Button>
							<Button
								variant={state.angleMode === "rad" ? "default" : "ghost"}
								size="xs"
								onClick={toggleAngle}
								className="text-xs h-7 px-2.5 rounded-lg font-mono"
							>
								RAD
							</Button>
						</div>
						<div className="flex items-center gap-1.5">
							<Button
								variant="ghost"
								size="xs"
								onClick={toggleHistory}
								className="text-xs h-7 px-2.5 rounded-lg"
							>
								<ClockCounterClockwise className="size-3.5" data-icon />
							</Button>
							<Button
								variant="ghost"
								size="xs"
								onClick={() => setHistory([])}
								className="text-xs h-7 px-2.5 rounded-lg"
							>
								<Clock className="size-3.5" data-icon />
							</Button>
						</div>
					</div>

					<AnimatePresence mode="wait">
						{state.showHistory && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="overflow-hidden mb-3"
							>
								<div className="bg-system-surface rounded-xl border border-border/50 max-h-32 overflow-y-auto p-3 space-y-1">
									{history.length === 0 && (
										<p className="text-xs text-muted-foreground/40 text-center py-2">
											No history yet
										</p>
									)}
									{history.map((entry, i) => (
										<button
											type="button"
											key={`${i}`}
											onClick={() => {
												const parts = entry.split(" = ");
												if (parts[1]) {
													setState((prev) => ({
														...prev,
														expression: parts[1],
														result: parts[1],
														showHistory: false,
													}));
												}
											}}
											className="text-xs font-mono text-muted-foreground/60 py-0.5 w-full text-left hover:text-muted-foreground transition-colors cursor-pointer"
										>
											{entry}
										</button>
									))}
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					<div className="flex-1 flex flex-col gap-1.5">
						{ROWS.map((row, rowIndex) => (
							<div
								key={rowIndex}
								className="grid grid-cols-5 gap-1.5 flex-none"
							>
								{row.map((btn) => (
									<Button
										key={btn.id}
										variant={btn.variant}
										size="sm"
										onClick={() => handleButton(btn.id)}
										className={cn(
											"h-9 text-sm rounded-lg font-mono transition-all active:scale-95",
											VARIANT_CLASSES[btn.variant],
										)}
									>
										{btn.label}
									</Button>
								))}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
