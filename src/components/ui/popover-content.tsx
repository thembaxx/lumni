"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";

export function PopoverContent({ className, ...props }: PopoverPrimitive.Popup.Props) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner>
        <PopoverPrimitive.Popup
          className={cn(
            "z-drawer w-72 rounded-xl border bg-popover p-4 text-popover-foreground shadow-md outline-none origin-(--transform-origin) data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 duration-125 data-closed:animate-out data-open:animate-in",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}
