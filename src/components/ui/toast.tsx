"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  exiting?: boolean;
}

export function toast(props: {
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}) {
  const { type, message, description, duration } = props;
  switch (type) {
    case "success":
      return sonnerToast.success(message, { description, duration });
    case "error":
      return sonnerToast.error(message, { description, duration });
    case "warning":
      return sonnerToast.warning(message, { description, duration });
    case "info":
      return sonnerToast.info(message, { description, duration });
  }
}

export function Toaster() {
  return <SonnerToaster richColors closeButton position="bottom-right" />;
}

export function useToast() {
  return toast;
}
