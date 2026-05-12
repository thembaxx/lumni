"use client";

import { Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DiagramInputProps {
	value: string | undefined;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export function DiagramInput({ value, onChange, disabled }: DiagramInputProps) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState<string | null>(value || null);

	const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result as string;
			setPreview(dataUrl);
			onChange(dataUrl);
		};
		reader.readAsDataURL(file);
	};

	const handleClear = () => {
		setPreview(null);
		onChange("");
		if (fileRef.current) fileRef.current.value = "";
	};

	return (
		<div className="space-y-3">
			{preview ? (
				<div className="relative inline-block">
					<img
						src={preview}
						alt="Uploaded diagram"
						className="max-w-sm max-h-48 rounded border"
					/>
					{!disabled && (
						<Button
							variant="destructive"
							size="icon"
							className="absolute top-1 right-1 h-6 w-6"
							onClick={handleClear}
						>
							<Trash2 className="size-3" />
						</Button>
					)}
				</div>
			) : (
				<div
					className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
					onClick={() => !disabled && fileRef.current?.click()}
				>
					<Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						Click to upload a diagram or sketch
					</p>
				</div>
			)}
			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				onChange={handleFile}
				className="hidden"
				disabled={disabled}
			/>
		</div>
	);
}
