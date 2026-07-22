import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { haptics } from "@/lib/utils/haptics";
import { buttonVariants } from "./button-variants";

type SlotProps = Omit<ButtonPrimitive.Props, "style">;

interface ButtonProps extends SlotProps, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Optional haptic feedback on press: "light" | "medium" | "heavy" */
  haptic?: "light" | "medium" | "heavy";
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild,
  haptic: hapticType,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : ButtonPrimitive;
  const hapticHandlers = hapticType ? { onPointerDown: () => haptics[hapticType!]() } : undefined;
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...hapticHandlers}
      {...props}
    />
  );
}

export { Button };
