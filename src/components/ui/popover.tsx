"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as React from "react";
import { cn } from "@/lib/shared";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({ className, ...props }: PopoverPrimitive.Popup.Props) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner>
				<PopoverPrimitive.Popup
					className={cn(
						"z-50 w-72 rounded-xl border bg-popover p-4 text-popover-foreground shadow-md outline-none",
						className,
					)}
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	);
}

export { Popover, PopoverContent, PopoverTrigger };
