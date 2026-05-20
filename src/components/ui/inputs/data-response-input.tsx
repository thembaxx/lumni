"use client";

import { ContentBlockRenderer } from "@/components/exam/content-block-renderer";
import { Textarea } from "@/components/ui/textarea";
import type { ContentBlock } from "@/types/exam-paper";

interface DataResponseInputProps {
	value?: string | undefined;
	onChange?: (value: string) => void;
	content?: ContentBlock[] | null;
	disabled?: boolean;
}

export function DataResponseInput({
	value = "",
	onChange = () => {},
	content,
	disabled,
}: DataResponseInputProps) {
	return (
		<div className="flex flex-col gap-4">
			{content?.map((block, idx) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: ContentBlock has no stable id
				<ContentBlockRenderer key={idx} block={block} />
			))}
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				placeholder="Analyse the data above and respond..."
				className="min-h-[120px]"
			/>
		</div>
	);
}
