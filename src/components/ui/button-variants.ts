import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] font-body font-bold text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-red)] text-white hover:bg-[var(--accent-red)]/90 border-none",
        primary:
          "bg-[var(--accent-red)] text-white hover:bg-[var(--accent-red)]/90 border-none",
        outline:
          "border-2 border-[var(--fg)] bg-transparent text-[var(--fg)] hover:bg-[var(--surface)]",
        secondary:
          "border-2 border-[var(--fg)] bg-transparent text-[var(--fg)] hover:bg-[var(--surface)]",
        ghost:
          "bg-transparent text-[var(--fg)] hover:bg-[var(--surface)] border-none normal-case tracking-normal font-semibold",
        destructive:
          "bg-[var(--accent-red)] text-white hover:bg-[var(--accent-red)]/90 border-none",
        link: "text-[var(--fg)] underline-offset-4 hover:underline border-none normal-case tracking-normal",
      },
      size: {
        default: "h-11 px-6 py-3 text-sm",
        xs: "h-6 px-2 text-[10px]",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-8 text-base",
        icon: "size-11 p-0",
        "icon-xs": "size-6 p-0",
        "icon-sm": "size-9 p-0",
        "icon-lg": "size-13 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export { buttonVariants };
