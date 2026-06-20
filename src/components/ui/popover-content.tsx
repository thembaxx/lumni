"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";

export function PopoverContent({
	className,
	...props
}: PopoverPrimitive.Popup.Props) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner>
				<PopoverPrimitive.Popup
					className={cn(
						"z-drawer w-72 rounded-xl border bg-popover p-4 text-popover-foreground shadow-md outline-none",
						className,
					)}
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	);
}
