"use client";

import * as React from "react";

import { cn } from "@/lib/shared";

interface ListCellProps {
	leading?: React.ReactNode;
	title: string;
	subtitle?: string;
	trailing?: React.ReactNode;
	onClick?: () => void;
	className?: string;
	showSeparator?: boolean;
	destructive?: boolean;
	disabled?: boolean;
}

function ListCell({
	leading,
	title,
	subtitle,
	trailing,
	onClick,
	className,
	showSeparator = true,
	destructive = false,
	disabled = false,
}: ListCellProps) {
	const Component = onClick ? "button" : "div";

	return (
		<Component
			type={onClick ? "button" : undefined}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"flex w-full items-center gap-4 px-5 py-4 text-left min-h-[56px]",
				"bg-[--system-surface] transition-[background-color,scale] duration-200",
				onClick &&
					"hover:bg-[--system-surface-secondary] active:bg-[--system-surface-secondary] active:scale-[0.96]",
				disabled && "opacity-50",
				showSeparator && "ios-separator",
				className,
			)}
		>
			{/* {leading && (
				<div className="flex shrink-0 items-center justify-center size-8 rounded-lg bg-secondary/30 text-system-accent">
					{leading}
				</div>
			)} */}
			<div className="flex-1 min-w-0">
				<div
					className={cn(
						"text-(length:--fs-body) font-medium text-sm text-foreground truncate",
						destructive && "text-[--system-destructive]",
					)}
				>
					{title}
				</div>
				{subtitle && (
					<div className="text-(length:--fs-footnote) font-medium text-sm text-[--system-text-secondary] mt-0.5 leading-snug">
						{subtitle}
					</div>
				)}
			</div>
			{trailing && <div className="flex shrink-0 items-center">{trailing}</div>}
		</Component>
	);
}

interface ListGroupProps {
	children: React.ReactNode;
	className?: string;
}

function ListGroup({ children, className }: ListGroupProps) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-[24px] bg-[--system-surface]",
				"shadow-level-1 border border-border/60",
				className,
			)}
		>
			{children}
		</div>
	);
}

interface ListSectionProps {
	children: React.ReactNode;
	header?: string;
	footer?: string;
	className?: string;
}

function ListSection({
	children,
	header,
	footer,
	className,
}: ListSectionProps) {
	return (
		<section className={cn("mb-8 last:mb-0", className)}>
			{header && (
				<div className="text-(length:--fs-footnote) text-[--system-text-tertiary] text-sm opacity-70 font-medium tracking-wider px-6 py-3">
					{header}
				</div>
			)}
			<ListGroup>{children}</ListGroup>
			{footer && (
				<div className="text-(length:--fs-caption-1) font-medium text-[--system-text-tertiary] px-6 py-3 leading-relaxed">
					{footer}
				</div>
			)}
		</section>
	);
}

export { ListCell, ListGroup, ListSection };
