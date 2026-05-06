"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { clsx } from "clsx";
import * as React from "react";

function Label({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			className={clsx(
				"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
