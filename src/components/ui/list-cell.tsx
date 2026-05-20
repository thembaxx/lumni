"use client";

import type * as React from "react";

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
	leading: _leading,
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
				"flex min-h-[56px] w-full items-center gap-4 px-5 py-4 text-left",
				"bg-[--system-surface] transition-[background-color,scale] duration-200",
				onClick &&
					"hover:bg-[--system-surface-secondary] active:scale-[0.96] active:bg-[--system-surface-secondary]",
				disabled && "opacity-50",
				showSeparator && "ios-separator",
				className,
			)}
		>
			<div className="min-w-0 flex-1">
				<div
					className={cn(
						"text-(length:--fs-body) truncate font-medium text-foreground text-sm",
						destructive && "text-[--system-destructive]",
					)}
				>
					{title}
				</div>
				{subtitle && (
					<div className="text-(length:--fs-footnote) mt-0.5 font-medium text-[--system-text-secondary] text-sm leading-snug">
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
				"border border-border/60 shadow-level-1",
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
				<div className="text-(length:--fs-footnote) px-6 py-3 font-medium text-[--system-text-tertiary] text-sm tracking-wider opacity-70">
					{header}
				</div>
			)}
			<ListGroup>{children}</ListGroup>
			{footer && (
				<div className="text-(length:--fs-caption-1) px-6 py-3 font-medium text-[--system-text-tertiary] leading-relaxed">
					{footer}
				</div>
			)}
		</section>
	);
}

export { ListCell, ListGroup, ListSection };
