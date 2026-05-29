"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type { PopoverContent } from "./popover-content";
import type { PopoverTrigger } from "./popover-trigger";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export { Popover, type PopoverContent, type PopoverTrigger };
