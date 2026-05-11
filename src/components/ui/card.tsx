import * as React from "react";

import { cn } from "@/lib/utils";

function Card({
	className,
	size = "default",
	...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
	return (
		<div
			data-slot="card"
			data-size={size}
			className={cn(
				"group/card flex flex-col gap-4 overflow-hidden bg-[#ffffff] text-[#000000] py-5 px-5",
				"rounded-lg shadow-[rgba(0,0,0,0.12)_0px_4px_16px_0px]",
				"dark:bg-[#0a0a0a] dark:text-[#ffffff] dark:shadow-[rgba(255,255,255,0.06)_0px_4px_16px_0px]",
				"transition-transform duration-200 hover:scale-[1.005]",
				"has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
				"data-[size=sm]:gap-3 data-[size=sm]:py-4 data-[size=sm]:px-4",
				className,
			)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				"group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-5",
				"has-data-[slot=card-action]:grid-cols-[1fr_auto]",
				"has-data-[slot=card-description]:grid-rows-[auto_auto]",
				className,
			)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-title"
			className={cn(
				"text-base leading-snug font-semibold tracking-tight group-data-[size=sm]/card:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-description"
			className={cn("text-sm text-[#4b4b4b] dark:text-[#afafaf]", className)}
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-action"
			className={cn(
				"col-start-2 row-span-2 row-start-1 self-start justify-self-end",
				className,
			)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-content"
			className={cn("px-5", className)}
			{...props}
		/>
	);
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-footer"
			className={cn(
				"flex items-center border-t border-[#000000]/10 dark:border-[#ffffff]/10 p-4 mt-4",
				className,
			)}
			{...props}
		/>
	);
}

export {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
};
