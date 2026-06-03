"use client";

import { type ComponentProps, createContext, use, useId } from "react";
import { cn } from "@/lib/shared";

interface FieldContextValue {
	id: string;
	invalid: boolean;
	disabled: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldContext() {
	const ctx = use(FieldContext);
	if (!ctx) throw new Error("Field components must be used within a <Field>");
	return ctx;
}

export function FieldGroup({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			data-slot="field-group"
			className={cn("flex flex-col gap-4", className)}
			{...props}
		/>
	);
}

export function Field({
	className,
	children,
	...props
}: ComponentProps<"div"> & {
	"data-invalid"?: boolean;
	"data-disabled"?: boolean;
}) {
	const id = useId();
	return (
		<FieldContext.Provider
			value={{
				id,
				invalid: !!props["data-invalid"],
				disabled: !!props["data-disabled"],
			}}
		>
			<div
				data-slot="field"
				className={cn("flex flex-col gap-1.5", className)}
				{...props}
			/>
		</FieldContext.Provider>
	);
}

export function FieldLabel({
	className,
	htmlFor,
	children,
	...props
}: ComponentProps<"label">) {
	const ctx = useFieldContext();
	return (
		<label
			data-slot="field-label"
			htmlFor={htmlFor || ctx.id}
			className={cn("font-medium text-foreground text-xs/relaxed", className)}
			{...props}
		>
			{children}
		</label>
	);
}

export function FieldDescription({ className, ...props }: ComponentProps<"p">) {
	return (
		<p
			data-slot="field-description"
			className={cn("text-muted-foreground text-xs", className)}
			{...props}
		/>
	);
}

export function FieldError({ className, ...props }: ComponentProps<"p">) {
	const ctx = useFieldContext();
	if (!ctx.invalid) return null;
	return (
		<p
			data-slot="field-error"
			className={cn("text-destructive text-xs", className)}
			{...props}
		/>
	);
}

export function InputGroup({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			data-slot="input-group"
			className={cn("flex items-center gap-2", className)}
			{...props}
		/>
	);
}

export function InputGroupAddon({
	className,
	...props
}: ComponentProps<"span">) {
	return (
		<span
			data-slot="input-group-addon"
			className={cn(
				"inline-flex items-center rounded-md border bg-muted/30 px-3 text-muted-foreground text-xs",
				className,
			)}
			{...props}
		/>
	);
}
