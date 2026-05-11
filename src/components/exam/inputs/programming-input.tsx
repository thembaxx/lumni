"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Textarea } from "@/components/ui/textarea";

interface ProgrammingInputProps {
	value: string | undefined;
	onChange: (value: string) => void;
	disabled?: boolean;
	language?: string;
	starterCode?: string;
}

export function ProgrammingInput({
	value = "",
	onChange,
	disabled,
	language = "delphi",
	starterCode,
}: ProgrammingInputProps) {
	return (
		<div className="space-y-3">
			{starterCode && (
				<div className="rounded border overflow-hidden">
					<div className="bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
						Starter Code ({language})
					</div>
					<SyntaxHighlighter
						language={language}
						style={oneLight}
						customStyle={{ margin: 0, fontSize: "0.8rem", maxHeight: 200 }}
					>
						{starterCode}
					</SyntaxHighlighter>
				</div>
			)}
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				placeholder={`Write your ${language} code here...`}
				className="min-h-[150px] font-mono text-sm"
			/>
		</div>
	);
}
