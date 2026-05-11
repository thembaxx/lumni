"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

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
				"flex w-full items-center gap-3 px-4 py-3 text-left min-h-[44px]",
				"bg-[--system-surface] transition-colors duration-150",
				onClick &&
					"hover:bg-[--system-surface-secondary] active:bg-[--system-surface-secondary]",
				disabled && "opacity-50",
				showSeparator && "ios-separator",
				className,
			)}
		>
			{leading && (
				<div className="flex shrink-0 items-center justify-center">
					{leading}
				</div>
			)}
			<div className="flex-1 min-w-0">
				<div
					className={cn(
						"ios-body font-normal truncate",
						destructive && "text-[--system-destructive]",
					)}
				>
					{title}
				</div>
				{subtitle && (
					<div className="ios-footnote text-[--system-text-secondary] mt-0.5">
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
				"overflow-hidden rounded-[--radius-list-group] bg-[--system-surface]",
				"shadow-[--shadow-level-1]",
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
		<section className={cn("", className)}>
			{header && (
				<div className="ios-footnote font-semibold text-[--system-text-secondary] uppercase tracking-wide px-4 py-2 pt-5">
					{header}
				</div>
			)}
			<ListGroup>{children}</ListGroup>
			{footer && (
				<div className="ios-footnote text-[--system-text-tertiary] px-4 py-2 pb-5">
					{footer}
				</div>
			)}
		</section>
	);
}

function ChevronRight({ className }: { className?: string }) {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			className={cn("text-[--system-text-tertiary]", className)}
		>
			<path
				d="M4.5 2.5L7.5 6L4.5 9.5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export { ChevronRight, ListCell, ListGroup, ListSection };
