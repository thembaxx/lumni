"use client";

import { motion } from "framer-motion";
import { Download, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminActionButtonProps {
	children: React.ReactNode;
	onClick: () => void;
	loading?: boolean;
	disabled?: boolean;
	variant?: "default" | "outline";
	icon?: React.ReactNode;
}

export function AdminActionButton({
	children,
	onClick,
	loading,
	disabled,
	variant = "default",
	icon,
}: AdminActionButtonProps) {
	return (
		<motion.button
			onClick={onClick}
			disabled={loading || disabled}
			whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
			whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
			className={cn(
				"flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50",
				variant === "default"
					? "bg-foreground text-background"
					: "border bg-transparent",
			)}
		>
			<motion.span
				animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
				className="flex items-center justify-center gap-2"
			>
				{loading && <Loader2 className="w-3 h-3 animate-spin" />}
				{icon && icon}
				{children}
			</motion.span>
		</motion.button>
	);
}

interface DownloadButtonProps {
	onClick: () => void;
	loading: boolean;
	disabled: boolean;
	selectedCount: number;
	examTypesCount: number;
}

export function DownloadButton({
	onClick,
	loading,
	disabled,
	selectedCount,
	examTypesCount,
}: DownloadButtonProps) {
	return (
		<AdminActionButton
			onClick={onClick}
			loading={loading}
			disabled={disabled}
			icon={<Download className="w-4 h-4" />}
		>
			Download {selectedCount} subject
			{selectedCount !== 1 ? "s" : ""} ({examTypesCount} exam
			{examTypesCount !== 1 ? "s" : ""})
		</AdminActionButton>
	);
}

interface UploadButtonProps {
	onClick: () => void;
	loading: boolean;
}

export function UploadButton({ onClick, loading }: UploadButtonProps) {
	return (
		<AdminActionButton
			onClick={onClick}
			loading={loading}
			icon={<Upload className="w-4 h-4" />}
		>
			Upload Local Exam Papers
		</AdminActionButton>
	);
}
