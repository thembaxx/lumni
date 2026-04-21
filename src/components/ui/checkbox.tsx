"use client";

import {
	CheckboxIndicator,
	Checkbox as CheckboxPrimitive,
} from "@radix-ui/react-checkbox";
import { IconCheck } from "@tabler/icons-react";
import { clsx } from "clsx";
import * as React from "react";

type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive>;

const Checkbox = React.forwardRef<
	React.ElementRef<typeof CheckboxPrimitive>,
	CheckboxProps
>(({ className, ...props }, ref) => (
	<CheckboxPrimitive
		ref={ref}
		className={clsx(
			"peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
			className,
		)}
		{...props}
	>
		<CheckboxIndicator
			className={clsx("flex items-center justify-center text-current")}
		>
			<IconCheck className="h-4 w-4" />
		</CheckboxIndicator>
	</CheckboxPrimitive>
));
Checkbox.displayName = CheckboxPrimitive.displayName;

export { Checkbox };
