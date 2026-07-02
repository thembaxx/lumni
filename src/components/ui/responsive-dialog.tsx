"use client";

import { createContext, useContext } from "react";
import type * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type Mode = "mobile" | "desktop";

const ResponsiveContext = createContext<Mode>("desktop");

function useMode(): Mode {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return isDesktop ? "desktop" : "mobile";
}

function ResponsiveDialog({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const mode = useMode();

  if (mode === "desktop") {
    return (
      <ResponsiveContext value="desktop">
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      </ResponsiveContext>
    );
  }

  return (
    <ResponsiveContext value="mobile">
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    </ResponsiveContext>
  );
}

function ResponsiveDialogTrigger({
  children,
  asChild,
  ...props
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const mode = useContext(ResponsiveContext);

  if (mode === "desktop") {
    return (
      <DialogTrigger {...props} render={asChild ? <div /> : undefined}>
        {children}
      </DialogTrigger>
    );
  }

  return (
    <DrawerTrigger {...props} asChild={asChild}>
      {children}
    </DrawerTrigger>
  );
}

function ResponsiveDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}) {
  const mode = useContext(ResponsiveContext);

  if (mode === "desktop") {
    return (
      <DialogContent className={className} showCloseButton={showCloseButton} {...props}>
        {children}
      </DialogContent>
    );
  }

  return (
    <DrawerContent className={cn("pb-6", className)} {...props}>
      {children}
    </DrawerContent>
  );
}

function ResponsiveDialogHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  const mode = useContext(ResponsiveContext);

  if (mode === "desktop") {
    return (
      <DialogHeader className={className} {...props}>
        {children}
      </DialogHeader>
    );
  }

  return (
    <DrawerHeader className={className} {...props}>
      {children}
    </DrawerHeader>
  );
}

function ResponsiveDialogFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  const mode = useContext(ResponsiveContext);

  if (mode === "desktop") {
    return (
      <DialogFooter className={className} {...props}>
        {children}
      </DialogFooter>
    );
  }

  return (
    <DrawerFooter className={className} {...props}>
      {children}
    </DrawerFooter>
  );
}

function ResponsiveDialogTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const mode = useContext(ResponsiveContext);

  if (mode === "desktop") {
    return <DialogTitle className={className}>{children}</DialogTitle>;
  }

  return <DrawerTitle className={className}>{children}</DrawerTitle>;
}

function ResponsiveDialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const mode = useContext(ResponsiveContext);

  if (mode === "desktop") {
    return <DialogDescription className={className}>{children}</DialogDescription>;
  }

  return <DrawerDescription className={className}>{children}</DrawerDescription>;
}

function ResponsiveDialogClose({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const mode = useContext(ResponsiveContext);

  if (mode === "desktop") {
    return <DialogClose className={className}>{children}</DialogClose>;
  }

  return <DrawerClose className={className}>{children}</DrawerClose>;
}

function ResponsiveDialogOverlay({ className }: { className?: string }) {
  const mode = useContext(ResponsiveContext);

  if (mode === "desktop") {
    return <DialogOverlay className={className} />;
  }

  return <DrawerOverlay className={className} />;
}

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogOverlay,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
};
