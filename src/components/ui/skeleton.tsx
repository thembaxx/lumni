import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn(
				"relative overflow-hidden rounded-md bg-muted",
				"before:absolute before:inset-0 before:-translate-x-full",
				"before:animate-[shimmer_2s_infinite]",
				"before:bg-muted-foreground/10",
				className,
			)}
			{...props}
		/>
	);
}

export { Skeleton };
