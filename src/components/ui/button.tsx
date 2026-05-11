import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-current active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				/* Uber Primary - Black pill */
				default:
					"bg-[#000000] text-[#ffffff] rounded-[999px] px-3 py-2 dark:bg-[#ffffff] dark:text-[#000000]",
				/* Uber Secondary - White with black border */
				outline:
					"border-[#000000] bg-[#ffffff] text-[#000000] rounded-[999px] px-3 py-2 hover:bg-[#e2e2e2] dark:border-[#ffffff] dark:bg-[#0a0a0a] dark:text-[#ffffff] dark:hover:bg-[#1a1a1a]",
				/* Uber Ghost */
				ghost:
					"hover:bg-[#efefef] text-[#000000] rounded-[999px] px-3 py-2 dark:text-[#ffffff] dark:hover:bg-[#1a1a1a]",
				/* Uber Destructive */
				destructive:
					"bg-[#000000] text-[#ffffff] rounded-[999px] px-3 py-2 dark:bg-[#ffffff] dark:text-[#000000]",
				/* Uber Link */
				link: "text-[#000000] underline-offset-4 hover:underline dark:text-[#ffffff]",
				/* Uber Pill Primary */
				uber_primary:
					"bg-[#000000] text-[#ffffff] rounded-[999px] px-3 py-2 hover:bg-[#1a1a1a] focus-visible:ring-[#ffffff] dark:bg-[#ffffff] dark:text-[#000000] dark:hover:bg-[#e5e5e5]",
				/* Uber Pill Secondary */
				uber_secondary:
					"bg-[#ffffff] text-[#000000] border border-[#000000] rounded-[999px] px-3 py-2 hover:bg-[#e2e2e2] focus-visible:ring-[#000000] dark:bg-[#1a1a1a] dark:text-[#ffffff] dark:border-[#ffffff] dark:hover:bg-[#2a2a2a]",
				/* Uber Chip/Filter */
				uber_chip:
					"bg-[#efefef] text-[#000000] rounded-[999px] px-4 py-3 hover:bg-[#e2e2e2] aria-expanded:bg-[#000000] aria-expanded:text-[#ffffff] dark:bg-[#1a1a1a] dark:text-[#ffffff] dark:hover:bg-[#2a2a2a] dark:aria-expanded:bg-[#ffffff] dark:aria-expanded:text-[#000000]",
				/* Secondary - alias for outline with slightly different tone */
				secondary:
					"border-[#000000] bg-[#ffffff] text-[#000000] rounded-[999px] px-3 py-2 hover:bg-[#e2e2e2] dark:border-[#ffffff] dark:bg-[#0a0a0a] dark:text-[#ffffff] dark:hover:bg-[#1a1a1a]",
				/* Uber Floating Action */
				uber_floating:
					"bg-[#ffffff] text-[#000000] rounded-[999px] px-3.5 py-3.5 shadow-[rgba(0,0,0,0.16)_0px_2px_8px_0px] translate-y-[2px] hover:bg-[#f3f3f3] dark:bg-[#1a1a1a] dark:text-[#ffffff] dark:shadow-[rgba(255,255,255,0.08)_0px_2px_8px_0px]",
			},
			size: {
				default: "h-9 gap-2 px-4",
				xs: "h-6 rounded-[999px] px-2 text-xs gap-1.5",
				sm: "h-8 rounded-[999px] px-3 text-sm gap-1.5",
				lg: "h-11 rounded-[999px] px-5 text-base gap-2",
				icon: "size-10 rounded-[999px]",
				"icon-xs": "size-6 rounded-[999px]",
				"icon-sm": "size-8 rounded-[999px]",
				"icon-lg": "size-12 rounded-[999px]",
				pill_sm: "h-8 rounded-[999px] px-3 py-2 text-xs gap-1.5",
				pill_default: "h-10 rounded-[999px] px-4 py-2.5 text-sm gap-2",
				pill_lg: "h-12 rounded-[999px] px-6 py-3 text-base gap-2",
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
