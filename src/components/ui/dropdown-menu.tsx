"use client";

import { Menu as ListPrimitive } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

function DropdownMenu({ ...props }: ListPrimitive.Root.Props) {
	return <ListPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({ ...props }: ListPrimitive.Trigger.Props) {
	return <ListPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
	align = "start",
	alignOffset = 0,
	side = "bottom",
	sideOffset = 4,
	className,
	...props
}: ListPrimitive.Popup.Props &
	Pick<
		ListPrimitive.Positioner.Props,
		"align" | "alignOffset" | "side" | "sideOffset"
	>) {
	return (
		<ListPrimitive.Portal>
			<ListPrimitive.Positioner
				className="isolate z-drawer outline-none"
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
			>
				<ListPrimitive.Popup
					data-slot="dropdown-menu-content"
					className={cn(
						"data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 z-drawer max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none ring-1 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in data-closed:overflow-hidden",
						className,
					)}
					{...props}
				/>
			</ListPrimitive.Positioner>
		</ListPrimitive.Portal>
	);
}

function DropdownMenuGroup({ ...props }: ListPrimitive.Group.Props) {
	return <ListPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
	className,
	inset,
	...props
}: ListPrimitive.GroupLabel.Props & {
	inset?: boolean;
}) {
	return (
		<ListPrimitive.GroupLabel
			data-slot="dropdown-menu-label"
			data-inset={inset}
			className={cn(
				"px-2 py-1.5 text-muted-foreground text-xs data-inset:pl-7.5",
				className,
			)}
			{...props}
		/>
	);
}

function DropdownMenuItem({
	className,
	inset,
	variant = "default",
	...props
}: ListPrimitive.Item.Props & {
	inset?: boolean;
	variant?: "default" | "destructive";
}) {
	return (
		<ListPrimitive.Item
			data-slot="dropdown-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(
				"group/dropdown-menu-item relative flex min-h-7 cursor-default select-none items-center gap-2 rounded-md px-2 py-1 text-xs/relaxed outline-hidden focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-inset:pl-7.5 data-[variant=destructive]:text-destructive data-disabled:opacity-50 data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[variant=destructive]:*:[svg]:text-destructive",
				className,
			)}
			{...props}
		/>
	);
}

function DropdownMenuSeparator({
	className,
	...props
}: ListPrimitive.Separator.Props) {
	return (
		<ListPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn("-mx-1 my-1 h-px bg-border/50", className)}
			{...props}
		/>
	);
}

export {
	DropdownMenu as DropdownList,
	DropdownMenuContent as DropdownListContent,
	DropdownMenuGroup as DropdownListGroup,
	DropdownMenuItem as DropdownListItem,
	DropdownMenuLabel as DropdownListLabel,
	DropdownMenuSeparator as DropdownListSeparator,
	DropdownMenuTrigger as DropdownListTrigger,
};
