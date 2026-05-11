import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				"h-10 w-full min-w-0 rounded-lg border border-[#000000] bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-[#afafaf] disabled:pointer-events-none disabled:opacity-50 dark:border-[#ffffff] dark:text-[#ffffff]",
				"focus-visible:ring-[2px] focus-visible:ring-[#000000] focus-visible:ring-offset-[2px] dark:focus-visible:ring-[#ffffff] dark:focus-visible:ring-offset-[#0a0a0a]",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
