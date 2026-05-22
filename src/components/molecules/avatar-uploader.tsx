"use client";

import { Upload02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";

interface AvatarUploaderProps extends React.ComponentProps<"div"> {
	url?: string;
	initials: string;
	onUpload: (file: File) => Promise<void>;
	isUploading?: boolean;
}

export function AvatarUploader({
	url,
	initials,
	onUpload,
	isUploading = false,
	className,
	...props
}: AvatarUploaderProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState<string | undefined>(url);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setPreview(URL.createObjectURL(file));
		await onUpload(file);
	};

	return (
		<div className={cn("flex items-center gap-4", className)} {...props}>
			<div className="relative">
				<Avatar className="size-20">
					<AvatarImage src={preview} />
					<AvatarFallback className="bg-primary font-medium text-2xl text-primary-foreground">
						{initials}
					</AvatarFallback>
				</Avatar>
				{isUploading && (
					<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
						<span className="text-white text-xs">...</span>
					</div>
				)}
			</div>
			<div className="flex flex-col gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => inputRef.current?.click()}
					disabled={isUploading}
				>
					<HugeiconsIcon icon={Upload02Icon} size={16} />
					Change Photo
				</Button>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					className="sr-only"
					onChange={handleFileChange}
				/>
			</div>
		</div>
	);
}
