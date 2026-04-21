"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

function Sheet({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
	return <DrawerPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
	return <DrawerPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetPortal({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
	return <DrawerPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetClose({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
	return <DrawerPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetOverlay({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
	return (
		<DrawerPrimitive.Overlay
			data-slot="sheet-overlay"
			className={cn(
				"fixed inset-0 z-50 bg-black/80 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
				className,
			)}
			{...props}
		/>
	);
}

interface SheetContentProps
	extends React.ComponentProps<typeof DrawerPrimitive.Content> {
	side?: "top" | "bottom" | "left" | "right";
}

function SheetContent({
	className,
	children,
	side,
	...props
}: SheetContentProps) {
	const direction = side || "right";

	return (
		<SheetPortal>
			<SheetOverlay />
			<DrawerPrimitive.Content
				data-slot="sheet-content"
				data-vaul-drawer-direction={direction}
				className={cn(
					"fixed z-50 flex h-full flex-col bg-popover text-popover-foreground",
					direction === "right" &&
						"inset-y-0 right-0 w-3/4 sm:max-w-sm rounded-l-xl border-l",
					direction === "left" &&
						"inset-y-0 left-0 w-3/4 sm:max-w-sm rounded-r-xl border-r",
					direction === "bottom" &&
						"inset-x-0 bottom-0 h-auto rounded-t-xl border-t",
					direction === "top" && "inset-x-0 top-0 h-auto rounded-b-xl border-b",
					className,
				)}
				{...props}
			>
				{children}
			</DrawerPrimitive.Content>
		</SheetPortal>
	);
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sheet-header"
			className={cn(
				"flex flex-col gap-1.5 p-4 text-center sm:text-left",
				className,
			)}
			{...props}
		/>
	);
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sheet-footer"
			className={cn("mt-auto flex flex-col-reverse gap-2 p-4", className)}
			{...props}
		/>
	);
}

function SheetTitle({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
	return (
		<DrawerPrimitive.Title
			data-slot="sheet-title"
			className={cn("text-lg font-medium text-foreground", className)}
			{...props}
		/>
	);
}

function SheetDescription({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
	return (
		<DrawerPrimitive.Description
			data-slot="sheet-description"
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
}

export {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetOverlay,
	SheetPortal,
	SheetTitle,
	SheetTrigger,
};
