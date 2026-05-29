"use client";

import {
	Cancel01Icon,
	CheckmarkCircle01Icon,
	PencilIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface EditableFieldProps {
	value: string;
	onSave: (value: string) => Promise<void>;
	placeholder?: string;
	icon?: React.ReactNode;
}

export function EditableField({
	value,
	onSave,
	placeholder,
	icon,
}: EditableFieldProps) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState("");
	const [saving, setSaving] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [editing]);

	const handleSave = useCallback(async () => {
		if (draft === value) {
			setEditing(false);
			return;
		}
		setSaving(true);
		try {
			await onSave(draft);
			setEditing(false);
		} catch {
			setDraft(value);
		} finally {
			setSaving(false);
		}
	}, [draft, value, onSave]);

	const handleCancel = useCallback(() => {
		setDraft(value);
		setEditing(false);
	}, [value]);

	if (editing) {
		return (
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					{icon && (
						<div className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
							{icon}
						</div>
					)}
					<Input
						ref={inputRef}
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSave();
							if (e.key === "Escape") handleCancel();
						}}
						placeholder={placeholder}
						className={`h-9 rounded-lg border-border/40 bg-system-surface text-sm ${icon ? "pl-9" : ""}`}
					/>
				</div>
				<button
					type="button"
					onClick={handleSave}
					disabled={saving || !draft.trim()}
					aria-label="Save profile changes"
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-accent text-white hover:bg-system-accent/90 disabled:opacity-50"
				>
					<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
				</button>
				<button
					type="button"
					onClick={handleCancel}
					aria-label="Cancel editing"
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-fill text-muted-foreground hover:bg-system-fill/80"
				>
					<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
				</button>
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={() => {
				setDraft(value);
				setEditing(true);
			}}
			className="group flex w-full items-center gap-2 text-left"
		>
			<span className="flex-1 truncate font-medium text-foreground text-sm">
				{value || placeholder || "Not set"}
			</span>
			<HugeiconsIcon
				icon={PencilIcon}
				className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
			/>
		</button>
	);
}
