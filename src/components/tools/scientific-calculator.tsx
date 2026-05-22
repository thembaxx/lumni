"use client";

import { Clock01Icon, Copy01Icon, UndoIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useCallback, useRef, useState } from "react";
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

type Token =
	| { type: "num"; value: number }
	| { type: "op"; op: string; prec: number; right: boolean }
	| { type: "func"; name: string }
	| { type: "lp" }
	| { type: "rp" }
	| { type: "fact" };

function tokenize(expression: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	while (i < expression.length) {
		const ch = expression[i];
		if (ch === " ") {
			i++;
			continue;
		}
		if (ch >= "0" && ch <= "9") {
			let num = "";
			while (i < expression.length && /[\d.]/.test(expression[i]))
				num += expression[i++];
			tokens.push({ type: "num", value: parseFloat(num) });
			continue;
		}
		if (ch === "+") {
			tokens.push({ type: "op", op: "+", prec: 2, right: false });
			i++;
			continue;
		}
		if (ch === "-") {
			const prev = tokens[tokens.length - 1];
			const isUnary =
				!prev ||
				prev.type === "op" ||
				prev.type === "lp" ||
				prev.type === "fact";
			tokens.push({
				type: "op",
				op: isUnary ? "u-" : "-",
				prec: isUnary ? 5 : 2,
				right: isUnary,
			});
			i++;
			continue;
		}
		if (ch === "*") {
			if (i + 1 < expression.length && expression[i + 1] === "*") {
				tokens.push({ type: "op", op: "**", prec: 4, right: true });
				i += 2;
				continue;
			}
			tokens.push({ type: "op", op: "*", prec: 3, right: false });
			i++;
			continue;
		}
		if (ch === "/") {
			tokens.push({ type: "op", op: "/", prec: 3, right: false });
			i++;
			continue;
		}
		if (ch === "%") {
			tokens.push({ type: "op", op: "%", prec: 3, right: false });
			i++;
			continue;
		}
		if (ch === "(") {
			tokens.push({ type: "lp" });
			i++;
			continue;
		}
		if (ch === ")") {
			tokens.push({ type: "rp" });
			i++;
			continue;
		}
		if (ch === "!") {
			tokens.push({ type: "fact" });
			i++;
			continue;
		}
		if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_") {
			let name = "";
			while (i < expression.length && /[\w.]/.test(expression[i]))
				name += expression[i++];
			tokens.push({ type: "func", name });
			continue;
		}
		throw new Error(`Unexpected character: ${ch}`);
	}
	return tokens;
}

function applyOp(op: string, a: number, b: number): number {
	switch (op) {
		case "+":
			return a + b;
		case "-":
			return a - b;
		case "*":
			return a * b;
		case "/":
			return a / b;
		case "%":
			return a % b;
		case "**":
			return a ** b;
		default:
			throw new Error(`Unknown operator: ${op}`);
	}
}

function applyFunc(name: string, arg: number): number {
	switch (name) {
		case "Math.sin":
		case "sin":
			return Math.sin(arg);
		case "Math.cos":
		case "cos":
			return Math.cos(arg);
		case "Math.tan":
		case "tan":
			return Math.tan(arg);
		case "Math.asin":
		case "asin":
			return Math.asin(arg);
		case "Math.acos":
		case "acos":
			return Math.acos(arg);
		case "Math.atan":
		case "atan":
			return Math.atan(arg);
		case "Math.log10":
		case "log10":
		case "log":
			return Math.log10(arg);
		case "Math.log":
		case "ln":
			return Math.log(arg);
		case "Math.sqrt":
		case "sqrt":
			return Math.sqrt(arg);
		case "Math.cbrt":
		case "cbrt":
			return Math.cbrt(arg);
		case "factorial":
			return factorial(arg);
		default:
			throw new Error(`Unknown function: ${name}`);
	}
}

function parseExpression(
	tokens: Token[],
	pos: number,
	minPrec: number,
): { val: number; pos: number } {
	if (pos >= tokens.length) throw new Error("Unexpected end of expression");

	const tok = tokens[pos];

	let result: { val: number; pos: number };

	if (tok.type === "num") {
		result = { val: tok.value, pos: pos + 1 };
	} else if (tok.type === "op" && tok.op === "u-") {
		const inner = parseExpression(tokens, pos + 1, tok.prec);
		result = { val: -inner.val, pos: inner.pos };
	} else if (tok.type === "lp") {
		result = parseExpression(tokens, pos + 1, 0);
		if (result.pos >= tokens.length || tokens[result.pos].type !== "rp")
			throw new Error("Missing closing parenthesis");
		result.pos++;
	} else if (tok.type === "func") {
		if (pos + 1 >= tokens.length || tokens[pos + 1].type !== "lp")
			throw new Error("Expected ( after function name");
		const inner = parseExpression(tokens, pos + 2, 0);
		if (inner.pos >= tokens.length || tokens[inner.pos].type !== "rp")
			throw new Error("Missing ) after function arguments");
		result = { val: applyFunc(tok.name, inner.val), pos: inner.pos + 1 };
	} else {
		throw new Error(`Unexpected token at position ${pos}`);
	}

	while (result.pos < tokens.length) {
		const next = tokens[result.pos];

		if (next.type === "fact") {
			result = { val: factorial(result.val), pos: result.pos + 1 };
			continue;
		}

		if (next.type === "op" && next.op !== "u-" && next.prec >= minPrec) {
			const nextMinPrec = next.right ? next.prec : next.prec + 1;
			const rhs = parseExpression(tokens, result.pos + 1, nextMinPrec);
			result = { val: applyOp(next.op, result.val, rhs.val), pos: rhs.pos };
			continue;
		}

		break;
	}

	return result;
}

function safeEval(expr: string, _angleMode: AngleMode): number {
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
		.replace(/mod\s+/gi, "%");

	const tokens = tokenize(prepared);
	const result = parseExpression(tokens, 0, 0);
	if (result.pos !== tokens.length)
		throw new Error("Unexpected tokens after expression");
	return result.val;
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
	const lastResult = useRef<number | null>(null);

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
						lastResult.current = Number.parseFloat(prev.result);
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
					if (lastResult.current !== null)
						appendToExpr(String(lastResult.current));
					break;
				default:
					appendToExpr(id);
			}
		},
		[appendToExpr, evaluateExpression, state.memory],
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
			className="flex h-full flex-col overflow-y-auto"
			onKeyDown={handleKeyDown}
			role="application"
		>
			<div className="px-6 pt-5 pb-3">
				<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
					Scientific CalculatorIcon
				</h2>
				<p className="ios-subhead mt-1.5 text-[--system-text-secondary]/60">
					{state.angleMode === "deg" ? "Degrees" : "Radians"}
					{state.memorySet && " · Memory stored"}
				</p>
			</div>

			<div className="flex-1 px-5 pb-5">
				<div className="flex h-full flex-col rounded-2xl bg-system-background-secondary p-5">
					<div className="mb-4 flex min-h-[88px] flex-col justify-end rounded-xl border border-border/50 bg-system-surface p-4">
						<div className="mb-1 select-all truncate text-right font-mono text-muted-foreground/60 text-xs">
							{state.expression || "0"}
						</div>
						<div className="flex items-center justify-between gap-2">
							<button
								type="button"
								onClick={handleCopy}
								className="shrink-0 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
							>
								<HugeiconsIcon
									icon={Copy01Icon}
									className="size-3.5"
									data-icon
								/>
							</button>
							<span
								className={cn(
									"select-all font-mono font-semibold text-2xl tracking-tight",
									state.error
										? "text-destructive"
										: "text-[--system-text-primary]",
								)}
							>
								{state.result}
							</span>
						</div>
					</div>

					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-1.5">
							<Button
								variant={state.angleMode === "deg" ? "default" : "ghost"}
								size="xs"
								onClick={toggleAngle}
								className="h-7 rounded-lg px-2.5 font-mono text-xs"
							>
								DEG
							</Button>
							<Button
								variant={state.angleMode === "rad" ? "default" : "ghost"}
								size="xs"
								onClick={toggleAngle}
								className="h-7 rounded-lg px-2.5 font-mono text-xs"
							>
								RAD
							</Button>
						</div>
						<div className="flex items-center gap-1.5">
							<Button
								variant="ghost"
								size="xs"
								onClick={toggleHistory}
								className="h-7 rounded-lg px-2.5 text-xs"
							>
								<HugeiconsIcon icon={UndoIcon} className="size-3.5" data-icon />
							</Button>
							<Button
								variant="ghost"
								size="xs"
								onClick={() => setHistory([])}
								className="h-7 rounded-lg px-2.5 text-xs"
							>
								<HugeiconsIcon
									icon={Clock01Icon}
									className="size-3.5"
									data-icon
								/>
							</Button>
						</div>
					</div>

					<AnimatePresence mode="wait" initial={false}>
						{state.showHistory && (
							<m.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="mb-3 overflow-hidden"
							>
								<div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-border/50 bg-system-surface p-3">
									{history.length === 0 && (
										<p className="py-2 text-center text-muted-foreground/40 text-xs">
											No history yet
										</p>
									)}
									{history.map((entry, _i) => (
										<button
											type="button"
											key={`hist-${entry}`}
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
											className="w-full cursor-pointer py-0.5 text-left font-mono text-muted-foreground/60 text-xs transition-colors hover:text-muted-foreground"
										>
											{entry}
										</button>
									))}
								</div>
							</m.div>
						)}
					</AnimatePresence>

					<div className="flex flex-1 flex-col gap-1.5">
						{ROWS.map((row, rowIndex) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: static keyboard rows
								key={rowIndex}
								className="grid flex-none grid-cols-5 gap-1.5"
							>
								{row.map((btn) => (
									<Button
										key={btn.id}
										variant={btn.variant}
										size="sm"
										onClick={() => handleButton(btn.id)}
										className={cn(
											"h-9 rounded-lg font-mono text-sm transition-transform active:scale-[0.96]",
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
