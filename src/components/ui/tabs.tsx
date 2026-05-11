"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function Tabs({
	className,
	orientation = "horizontal",
	...props
}: TabsPrimitive.Root.Props) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			data-orientation={orientation}
			className={cn(
				"group/tabs flex gap-2 data-horizontal:flex-col",
				className,
			)}
			{...props}
		/>
	);
}

const tabsListVariants = cva(
	"group/tabs-list inline-flex w-fit items-center justify-center rounded-[999px] p-[3px] bg-[#efefef] dark:bg-[#1a1a1a] data-[variant=pill]:rounded-[999px] data-[variant=line]:rounded-none",
	{
		variants: {
			variant: {
				default: "bg-[#efefef] dark:bg-[#1a1a1a]",
				line: "gap-1 bg-transparent",
				pill: "bg-transparent p-0 gap-2",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function TabsList({
	className,
	variant = "default",
	...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			data-variant={variant}
			className={cn(tabsListVariants({ variant }), className)}
			{...props}
		/>
	);
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
	return (
		<TabsPrimitive.Tab
			data-slot="tabs-trigger"
			className={cn(
				"relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-[999px] border border-transparent px-4 py-2.5 text-sm font-medium whitespace-nowrap text-[#4b4b4b] transition-all duration-150 hover:bg-[#e2e2e2] hover:text-[#000000] focus-visible:ring-[2px] disabled:pointer-events-none disabled:opacity-50",
				"dark:text-[#afafaf] dark:hover:bg-[#2a2a2a] dark:hover:text-[#ffffff]",
				"data-[variant=default]/tabs-list:data-active:bg-[#000000] data-[variant=default]/tabs-list:data-active:text-[#ffffff] data-[variant=default]/tabs-list:data-active:shadow-[rgba(0,0,0,0.12)_0px_4px_16px_0px]",
				"data-[variant=default]/tabs-list:dark:data-active:bg-[#ffffff] data-[variant=default]/tabs-list:dark:data-active:text-[#000000]",
				"data-[variant=pill]/tabs-list:bg-[#efefef] data-[variant=pill]/tabs-list:hover:bg-[#e2e2e2]",
				"data-[variant=pill]/tabs-list:data-active:bg-[#000000] data-[variant=pill]/tabs-list:data-active:text-[#ffffff] data-[variant=pill]/tabs-list:dark:bg-[#1a1a1a] data-[variant=pill]/tabs-list:dark:hover:bg-[#2a2a2a] data-[variant=pill]/tabs-list:dark:data-active:bg-[#ffffff] data-[variant=pill]/tabs-list:dark:data-active:text-[#000000]",
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
	return (
		<TabsPrimitive.Panel
			data-slot="tabs-content"
			className={cn("flex-1 text-sm outline-none", className)}
			{...props}
		/>
	);
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
