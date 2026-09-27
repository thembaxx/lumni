import type * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.ComponentProps<"div"> {
  variant?: "hero" | "flat" | "default";
  size?: "sm" | "md" | "lg" | string;
}

function Card({ className, variant = "flat", size, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-size={size}
      className={cn(
        variant === "hero"
          ? "bg-[var(--bg)] border-2 border-[var(--fg)] rounded-[var(--radius-md)] p-5.5 text-[var(--fg)]"
          : "bg-[var(--surface)] rounded-[var(--radius-lg)] p-6 text-[var(--fg)] border-none",
        size === "sm" && "p-4",
        size === "lg" && "p-8",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-header" className={cn("flex flex-col gap-1 mb-3", className)} {...props} />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-display font-bold text-lg text-[var(--fg)]", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[var(--fg-muted)] text-sm font-body", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-action" className={cn("ml-auto self-start", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("font-body text-sm", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "mt-4 flex items-center justify-between pt-3 border-t border-[var(--border-soft)]",
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
