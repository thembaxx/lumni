import { cn } from "@/lib/utils";

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "pulse" | "shimmer";
  shape?: "default" | "text" | "card" | "avatar" | "circle";
}

const shapeStyles = {
  default: "rounded-md",
  text: "h-4 w-full rounded-md",
  card: "h-32 w-full rounded-xl",
  avatar: "size-10 rounded-full",
  circle: "size-8 rounded-full",
};

function Skeleton({ className, variant = "pulse", shape = "default", ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        variant === "shimmer"
          ? "relative overflow-hidden rounded-md bg-muted"
          : "animate-pulse rounded-md bg-muted",
        shape !== "default" && shapeStyles[shape],
        className,
      )}
      {...props}
    >
      {variant === "shimmer" && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
      )}
    </div>
  );
}

export { Skeleton };
