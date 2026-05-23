"use client";

import { ListViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { TTSButton } from "@/components/shared/tts-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/shared";

interface NoteEditorProps extends React.ComponentProps<"div"> {
	initialTitle?: string;
	initialContent?: string;
	onSave: (note: { title: string; content: string }) => void;
	isSaving?: boolean;
}

export function NoteEditor({
	initialTitle = "",
	initialContent = "",
	onSave,
	isSaving = false,
	className,
	...props
}: NoteEditorProps) {
	const [title, setTitle] = useState(initialTitle);
	const [content, setContent] = useState(initialContent);
	const contentRef = useRef<HTMLTextAreaElement>(null);

	const insertBulletList = () => {
		const textarea = contentRef.current;
		if (!textarea) return;
		const start = textarea.selectionStart;
		const before = content.slice(0, start);
		const after = content.slice(start);
		const insertion = "\n- ";
		setContent(before + insertion + after);
		requestAnimationFrame(() => {
			textarea.focus();
			textarea.setSelectionRange(start + insertion.length, start + insertion.length);
		});
	};

	return (
		<div className={cn("flex flex-col gap-3", className)} {...props}>
			<Input
				placeholder="Note title"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				className="h-10 font-medium"
			/>
			<div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
				<Button
					variant="ghost"
					size="icon-xs"
					type="button"
					aria-label="Bullet list"
					onClick={insertBulletList}
				>
					<HugeiconsIcon icon={ListViewIcon} size={14} />
				</Button>
				<div className="ml-auto">
					<TTSButton text={content} />
				</div>
			</div>
			<Textarea
				ref={contentRef}
				placeholder="Start writing..."
				value={content}
				onChange={(e) => setContent(e.target.value)}
				className="min-h-[200px] resize-y"
			/>
			<Button
				onClick={() => onSave({ title, content })}
				disabled={!title.trim() || isSaving}
				className="w-fit self-end"
			>
				{isSaving ? "Saving..." : "Save Note"}
			</Button>
		</div>
	);
}
