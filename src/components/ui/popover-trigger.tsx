"use client";

import { memo } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

export const PopoverTrigger = memo(function PopoverTrigger({
  ...props
}: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
});
