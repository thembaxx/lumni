"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { AngleMode } from "@/lib/calculator/engine";
import { safeEval } from "@/lib/calculator/engine";
import { ButtonGrid } from "./calculator-button-grid";
import { CalculatorDisplay } from "./calculator-display";
import { HistoryPanel } from "./calculator-history";
import { CalculatorToolbar } from "./calculator-toolbar";

interface CalcState {
	expression: string;
	result: string;
	memory: number;
	memorySet: boolean;
	angleMode: AngleMode;
	showHistory: boolean;
	error: boolean;
}

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

	const handleHistorySelect = useCallback((entry: string) => {
		const parts = entry.split(" = ");
		if (parts[1]) {
			setState((prev) => ({
				...prev,
				expression: parts[1],
				result: parts[1],
				showHistory: false,
			}));
		}
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
					<CalculatorDisplay
						expression={state.expression}
						result={state.result}
						error={state.error}
						onCopy={handleCopy}
					/>

					<CalculatorToolbar
						angleMode={state.angleMode}
						onToggleAngle={toggleAngle}
						onToggleHistory={toggleHistory}
						onClearHistory={() => setHistory([])}
					/>

					<HistoryPanel
						show={state.showHistory}
						history={history}
						onSelectResult={handleHistorySelect}
					/>

					<ButtonGrid onButtonClick={handleButton} />
				</div>
			</div>
		</div>
	);
}
