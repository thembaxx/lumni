"use client";

import { type ComponentProps, createContext, use, useId, useMemo } from "react";
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
	"data-invalid": dataInvalid,
	"data-disabled": dataDisabled,
	...props
}: ComponentProps<"div"> & {
	"data-invalid"?: boolean;
	"data-disabled"?: boolean;
}) {
	const id = useId();
	const fieldValue = useMemo(
		() => ({
			id,
			invalid: !!dataInvalid,
			disabled: !!dataDisabled,
		}),
		[id, dataInvalid, dataDisabled],
	);
	return (
		<FieldContext.Provider value={fieldValue}>
			<div
				data-slot="field"
				data-invalid={dataInvalid}
				data-disabled={dataDisabled}
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
