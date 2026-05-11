"use client";

import { domAnimation, LazyMotion, m } from "framer-motion";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputOTPProps {
	className?: string;
	maxLength?: number;
	onComplete?: (value: string) => void;
	error?: boolean;
	value?: string;
	onChange?: (value: string) => void;
}

interface InputOTPSegementProps {
	index: number;
	value: string;
	segments: string[];
	error?: boolean;
}

function InputOTPSegment({
	index,
	value,
	segments,
	error,
}: InputOTPSegementProps) {
	const hasText = value.length > 0;
	const isActive = index === segments.findIndex((s) => s === "");

	return (
		<m.div
			className={cn(
				"relative flex h-12 w-10 items-center justify-center rounded-lg border bg-transparent transition-all",
				error
					? "border-destructive animate-shake"
					: isActive
						? "border-ring ring-2 ring-ring/30"
						: hasText
							? "border-muted-foreground"
							: "border-input",
			)}
			animate={{
				x: error ? [0, -6, 6, -6, 6, 0] : 0,
			}}
			transition={{
				duration: error ? 0.4 : 0,
			}}
		>
			<span
				className={cn(
					"text-lg font-medium tabular-nums",
					hasText ? "text-foreground" : "text-muted-foreground/50",
				)}
			>
				{hasText ? value : ""}
			</span>
		</m.div>
	);
}

function InputOTPInner(
	{
		className,
		maxLength = 6,
		onComplete,
		error = false,
		value: controlledValue,
		onChange,
	}: InputOTPProps,
	ref: React.Ref<HTMLInputElement>,
) {
	// biome-ignore lint/correctness/useHookAtTopLevel: forwardRef callback is a valid component scope
	const [internalValue, setInternalValue] = useState("");
	// biome-ignore lint/correctness/useHookAtTopLevel: forwardRef callback is a valid component scope
	const [isShaking, setIsShaking] = useState(false);

	const value = controlledValue ?? internalValue;
	const segments = Array.from({ length: maxLength }, (_, i) => value[i] || "");

	// biome-ignore lint/correctness/useHookAtTopLevel: forwardRef callback is a valid component scope
	const setValue = useCallback(
		(newValue: string) => {
			const sanitized = newValue.replace(/\D/g, "").slice(0, maxLength);
			setInternalValue(sanitized);
			onChange?.(sanitized);
			if (sanitized.length === maxLength && onComplete) {
				onComplete(sanitized);
			}
		},
		[maxLength, onChange, onComplete],
	);

	// biome-ignore lint/correctness/useHookAtTopLevel: forwardRef callback is a valid component scope
	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setValue(e.target.value);
		},
		[setValue],
	);

	// biome-ignore lint/correctness/useHookAtTopLevel: forwardRef callback is a valid component scope
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Backspace" && value.length === 0) {
				e.preventDefault();
			}
		},
		[value],
	);

	// biome-ignore lint/correctness/useHookAtTopLevel: forwardRef callback is a valid component scope
	const handlePaste = useCallback(
		(e: React.ClipboardEvent) => {
			e.preventDefault();
			const pasted = e.clipboardData
				.getData("text")
				.replace(/\D/g, "")
				.slice(0, maxLength);
			setValue(pasted);
		},
		[setValue, maxLength],
	);

	// biome-ignore lint/correctness/useHookAtTopLevel: forwardRef callback is a valid component scope
	useEffect(() => {
		if (error && !isShaking) {
			setIsShaking(true);
			const timer = setTimeout(() => setIsShaking(false), 400);
			return () => clearTimeout(timer);
		}
	}, [error, isShaking]);

	// biome-ignore lint/correctness/useHookAtTopLevel: forwardRef callback is a valid component scope
	useEffect(() => {
		if (!isShaking && value.length === 0) {
			const input = document.getElementById("input-otp");
			input?.focus();
		}
	}, [value, isShaking]);

	return (
		<LazyMotion features={domAnimation}>
			<div className={cn("flex gap-2 justify-center", className)}>
				<div className="flex gap-1.5">
					{segments.map((segment, index) => (
						<InputOTPSegment
							key={index}
							index={index}
							value={segment}
							segments={segments}
							error={isShaking}
						/>
					))}
				</div>
				<Input
					id="input-otp"
					ref={ref}
					className="sr-only"
					autoComplete="one-time-code"
					inputMode="numeric"
					maxLength={maxLength}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					value={value}
				/>
			</div>
		</LazyMotion>
	);
}

export const InputOTP = forwardRef<HTMLInputElement, InputOTPProps>(
	InputOTPInner,
);
InputOTP.displayName = "InputOTP";
