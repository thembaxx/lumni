import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[scale,background-color,box-shadow,color] duration-150 ease-out outline-none select-none active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				/* iOS Primary - Blue accent fill */
				default:
					"bg-[#007AFF] text-[#ffffff] rounded-[12px] px-3 py-2 hover:bg-[#0066D6] dark:bg-[#0A84FF] dark:text-[#ffffff] dark:hover:bg-[#0066D6]",
				/* iOS Outline - Blue border */
				outline:
					"border-[#007AFF] bg-transparent text-[#007AFF] rounded-[12px] px-3 py-2 hover:bg-[#007AFF]/5 dark:border-[#0A84FF] dark:text-[#0A84FF] dark:hover:bg-[#0A84FF]/10",
				/* iOS Ghost - Subtle text */
				ghost:
					"text-[--system-text-secondary] rounded-[12px] px-3 py-2 hover:bg-[--system-surface-secondary] dark:text-[--system-text-secondary] dark:hover:bg-[--system-surface-secondary]",
				/* iOS Destructive - Red */
				destructive:
					"bg-[#FF3B30] text-[#ffffff] rounded-[12px] px-3 py-2 hover:bg-[#D70015] dark:bg-[#FF453A] dark:text-[#ffffff]",
				/* Link */
				link: "text-[--system-accent] underline-offset-4 hover:underline dark:text-[--system-accent]",
				/* iOS Secondary fill - light gray */
				secondary:
					"bg-[--system-surface-secondary] text-[--system-text-primary] rounded-[12px] px-3 py-2 hover:bg-[--system-separator] dark:bg-[--system-surface-secondary] dark:text-[--system-text-primary]",
				/* Floating action - elevated */
				uber_floating:
					"bg-[--system-surface] text-[--system-text-primary] rounded-[12px] px-3.5 py-3.5 shadow-[--shadow-level-2] hover:bg-[--system-surface-secondary] dark:bg-[--system-surface] dark:text-[--system-text-primary]",
			},
			size: {
				default: "h-11 gap-2 px-4 min-h-[44px]",
				xs: "h-7 rounded-[10px] px-2 text-xs gap-1.5 min-h-[28px]",
				sm: "h-9 rounded-[10px] px-3 text-sm gap-1.5 min-h-[36px]",
				lg: "h-12 rounded-[12px] px-5 text-base gap-2 min-h-[48px]",
				icon: "size-11 rounded-full",
				"icon-xs": "size-7 rounded-full",
				"icon-sm": "size-9 rounded-full",
				"icon-lg": "size-12 rounded-full",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
