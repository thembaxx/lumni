import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				"h-11 w-full min-w-0 rounded-[10px] border border-[--system-separator] bg-[--system-surface] px-3 py-2 text-sm transition-colors outline-none placeholder:text-[--system-text-tertiary] disabled:pointer-events-none disabled:opacity-50 dark:bg-[--system-surface] dark:text-[--system-text-primary]",
				"focus-visible:border-[--system-accent] focus-visible:ring-[2px] focus-visible:ring-[--system-accent]",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
