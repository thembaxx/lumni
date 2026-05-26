export type AngleMode = "deg" | "rad";

export type Token =
	| { type: "num"; value: number }
	| { type: "op"; op: string; prec: number; right: boolean }
	| { type: "func"; name: string }
	| { type: "lp" }
	| { type: "rp" }
	| { type: "fact" };

export function factorial(n: number): number {
	if (n < 0 || !Number.isInteger(n)) return NaN;
	if (n <= 1) return 1;
	let r = 1;
	for (let i = 2; i <= n; i++) r *= i;
	return r;
}

export function tokenize(expression: string): Token[] {
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

export function applyOp(op: string, a: number, b: number): number {
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

export function applyFunc(name: string, arg: number): number {
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

export function parseExpression(
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

export function safeEval(expr: string, _angleMode: AngleMode): number {
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
