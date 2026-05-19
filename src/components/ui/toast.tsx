"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/shared";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastData {
	id: string;
	type: ToastType;
	message: string;
	description?: string;
	duration?: number;
	exiting?: boolean;
}

interface ToastContextType {
	toasts: ToastData[];
	toast: (props: Omit<ToastData, "id">) => void;
	dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToastContext() {
	const context = useContext(ToastContext);
	if (!context) {
		return null;
	}
	return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastData[]>([]);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) =>
			prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
		);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 200);
	}, []);

	const toast = useCallback(
		(props: Omit<ToastData, "id">) => {
			const id = Math.random().toString(36).slice(2);
			const newToast: ToastData = {
				...props,
				id,
				duration: props.duration ?? 5000,
			};
			setToasts((prev) => [...prev, newToast]);

			setTimeout(() => {
				dismiss(id);
			}, newToast.duration);
		},
		[dismiss],
	);

	return (
		<ToastContext.Provider value={{ toasts, toast, dismiss }}>
			{children}
			<ToastContainer toasts={toasts} />
		</ToastContext.Provider>
	);
}

function ToastContainer({ toasts }: { toasts: ToastData[] }) {
	if (toasts.length === 0) return null;

	return (
		<div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-sm flex-col gap-2">
			{toasts.map((t) => (
				<ToastItem key={t.id} toast={t} />
			))}
		</div>
	);
}

const toastStyles: Record<ToastType, string> = {
	success:
		"border-success/30 bg-success/10 text-success-foreground dark:text-success-foreground",
	error: "border-destructive/50 bg-destructive/10 text-destructive",
	warning:
		"border-warning/30 bg-warning/10 text-warning-foreground dark:text-warning-foreground",
	info: "border-[--system-accent]/50 bg-[--system-accent]/10 text-[--system-accent] dark:text-[--system-accent]",
};

const toastIcons: Record<ToastType, string> = {
	success: "✓",
	error: "✕",
	warning: "⚠",
	info: "ℹ",
};

export function ToastItem({ toast: t }: { toast: ToastData }) {
	return (
		<div
			className={cn(
				"pointer-events-auto flex w-full items-center gap-3 rounded-lg border p-4 shadow-lg transition-[opacity,transform] duration-200",
				t.exiting
					? "translate-y-2 scale-95 opacity-0"
					: "slide-in-from-bottom-4 animate-in",
				toastStyles[t.type],
			)}
		>
			<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10 font-extrabold text-xs">
				{toastIcons[t.type]}
			</span>
			<div className="min-w-0 flex-1">
				<p className="font-medium text-sm">{t.message}</p>
				{t.description && (
					<p className="mt-0.5 text-xs opacity-80">{t.description}</p>
				)}
			</div>
		</div>
	);
}

export function useToast() {
	const context = useToastContext();
	if (!context) {
		return null;
	}
	return context.toast;
}

export function toast(props: Omit<ToastData, "id">) {
	const id = Math.random().toString(36).slice(2);
	const newToast: ToastData = {
		...props,
		id,
		duration: props.duration ?? 5000,
	};

	const container = document.getElementById("toast-root");
	if (container) {
		const toastEl = document.createElement("div");
		toastEl.className = cn(
			"pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-4 transition-[opacity,transform] duration-200",
			toastStyles[props.type],
		);
		toastEl.innerHTML = `
			<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs font-extrabold">
				${toastIcons[props.type]}
			</span>
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium">${props.message}</p>
				${props.description ? `<p class="text-xs opacity-80 mt-0.5">${props.description}</p>` : ""}
			</div>
		`;
		container.appendChild(toastEl);

		setTimeout(() => {
			toastEl.classList.add("opacity-0", "translate-y-2", "scale-95");
			setTimeout(() => {
				toastEl.remove();
			}, 200);
		}, newToast.duration);
	}
}

export function Toaster() {
	return <div id="toast-root" />;
}
