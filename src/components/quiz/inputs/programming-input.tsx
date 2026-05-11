"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ProgrammingInputProps {
	language: string;
	starterCode?: string;
	onSubmit: (code: string) => void;
	disabled?: boolean;
}

export function ProgrammingInput({ language, starterCode, onSubmit, disabled }: ProgrammingInputProps) {
	const [code, setCode] = useState(starterCode || "");

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<span className="text-xs font-mono bg-muted px-2 py-1 rounded">{language}</span>
				{starterCode && <span className="text-xs text-muted-foreground">Edit the starter code below</span>}
			</div>
			<Textarea
				value={code}
				onChange={(e) => setCode(e.target.value)}
				placeholder={`Write your ${language} code here...`}
				disabled={disabled}
				className="min-h-[200px] w-full font-mono text-sm"
			/>
			<div className="flex justify-end">
				<Button onClick={() => onSubmit(code)} disabled={disabled || !code.trim()}>
					Submit Code
				</Button>
			</div>
		</div>
	);
}
