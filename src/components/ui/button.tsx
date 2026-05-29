import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/shared";
import { buttonVariants } from "./button-variants";

interface ButtonProps
	extends ButtonPrimitive.Props,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

function Button({
	className,
	variant = "default",
	size = "default",
	asChild,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot : ButtonPrimitive;
	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button };
