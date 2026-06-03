"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";
import { AnimatedIcon } from "@/lib/utils/icon-mapping";

/* ─── Subcomponents (from @/components/ui/empty) ─── */

function Empty({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty"
			className={cn(
				"flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 text-balance rounded-xl border-dashed p-6 text-center",
				className,
			)}
			{...props}
		/>
	);
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty-header"
			className={cn("flex max-w-sm flex-col items-center gap-1", className)}
			{...props}
		/>
	);
}

const emptyMediaVariants = cva(
	"mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-transparent",
				icon: "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

interface EmptyMediaProps
	extends React.ComponentProps<"div">,
		VariantProps<typeof emptyMediaVariants> {}

function EmptyMedia({
	className,
	variant = "default",
	...props
}: EmptyMediaProps) {
	return (
		<div
			data-slot="empty-icon"
			data-variant={variant}
			className={cn(emptyMediaVariants({ variant, className }))}
			{...props}
		/>
	);
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty-title"
			className={cn(
				"font-heading font-medium text-sm tracking-tight",
				className,
			)}
			{...props}
		/>
	);
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<div
			data-slot="empty-description"
			className={cn(
				"text-muted-foreground text-xs/relaxed [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
				className,
			)}
			{...props}
		/>
	);
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty-content"
			className={cn(
				"flex w-full min-w-0 max-w-sm flex-col items-center gap-2 text-balance text-xs/relaxed",
				className,
			)}
			{...props}
		/>
	);
}

/* ─── EmptyState (wrapper with icon, title, description, action) ─── */

interface EmptyStateProps {
	icon?: IconSvgElement;
	title: string;
	description?: string;
	action?: React.ReactNode;
	overlay?: boolean;
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	overlay,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex h-full items-center justify-center",
				overlay && "absolute inset-0 z-sticky bg-background/95",
				className,
			)}
		>
			<Empty>
				<EmptyHeader>
					{icon && (
						<HugeiconsIcon
							icon={icon}
							className="mx-auto size-10 text-muted-foreground/30"
						/>
					)}
					<EmptyTitle>{title}</EmptyTitle>
				</EmptyHeader>
				<EmptyContent>
					{description && <EmptyDescription>{description}</EmptyDescription>}
					{action && action}
				</EmptyContent>
			</Empty>
		</div>
	);
}

/* ─── EmptyStateWithIllustration (from @/components/empty-states) ─── */

interface EmptyStateWithIllustrationProps {
	icon?: IconSvgElement;
	title: string;
	description: string;
	action?: { label: string; onClick: () => void };
	secondaryAction?: { label: string; onClick: () => void };
	animation?: "search" | "upload" | "error";
}

const ANIMATION_MAP: Record<"search" | "upload" | "error", string> = {
	search: "empty-search",
	upload: "empty-upload",
	error: "error-state",
};

function AnimatedIllustration({
	animation,
}: {
	animation: "search" | "upload" | "error";
}) {
	return <AnimatedIcon name={ANIMATION_MAP[animation]} className="size-14" />;
}

export function EmptyStateWithIllustration({
	icon,
	title,
	description,
	action,
	secondaryAction,
	animation,
}: EmptyStateWithIllustrationProps) {
	return (
		<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
			<div className="relative mb-6">
				<div className="absolute inset-0 rounded-full bg-muted/50 blur-xl" />
				<div className="relative flex size-20 items-center justify-center rounded-full border border-muted-foreground/30 border-dashed bg-muted/30">
					{animation ? (
						<AnimatedIllustration animation={animation} />
					) : icon ? (
						<HugeiconsIcon
							icon={icon}
							className="size-8 text-muted-foreground/60"
						/>
					) : null}
				</div>
			</div>
			<h3 className="balance mb-2 w-full text-wrap text-center font-semibold text-xl">
				{title}
			</h3>
			<p className="mb-6 max-w-md text-muted-foreground text-sm">
				{description}
			</p>
			<div className="flex gap-2">
				{secondaryAction && (
					<Button variant="outline" onClick={secondaryAction.onClick}>
						{secondaryAction.label}
					</Button>
				)}
				{action && <Button onClick={action.onClick}>{action.label}</Button>}
			</div>
		</div>
	);
}

export {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
};
