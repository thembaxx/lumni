"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { DataTable } from "@/types/exam-paper";

const EMPTY_PAIRS: Record<string, string> = {};

interface MatchingInputProps {
	table: DataTable;
	value?: Record<string, string>;
	onChange: (pairs: Record<string, string>) => void;
	disabled?: boolean;
}

export function MatchingInput({
	table,
	value = EMPTY_PAIRS,
	onChange,
	disabled,
}: MatchingInputProps) {
	const colA = table.headers[0] || "Column A";
	const colB = table.headers[1] || "Column B";
	const items: Array<{ left: string; right: string }> = [];
	for (const row of table.rows) {
		const leftVal = row[0];
		const rightVal = row[1];
		if (leftVal != null && rightVal != null) {
			items.push({ left: String(leftVal), right: String(rightVal) });
		}
	}

	const rightOptions = [...new Set(items.map((i) => i.right))];

	return (
		<div className="flex flex-col gap-3">
			<div className="mb-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3 font-medium text-muted-foreground text-sm">
				<span>{colA}</span>
				<span />
				<span>{colB}</span>
			</div>
			{items.map((item) => {
				const itemLeft = item.left;
				return (
					<div
						key={item.left}
						className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"
					>
						<span className="text-sm">{itemLeft}</span>
						<span className="text-muted-foreground">↔</span>
						<Select
							value={value?.[itemLeft] || ""}
							onValueChange={(v) => {
								if (v) onChange({ ...value, [itemLeft]: v });
							}}
							disabled={disabled}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select..." />
							</SelectTrigger>
							<SelectContent>
								{rightOptions.map((opt) => (
									<SelectItem key={opt} value={opt}>
										{opt}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				);
			})}
		</div>
	);
}
