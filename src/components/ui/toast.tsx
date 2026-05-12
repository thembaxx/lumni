"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastData {
	id: string;
	type: ToastType;
	message: string;
	description?: string;
	duration?: number;
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

	const toast = useCallback((props: Omit<ToastData, "id">) => {
		const id = Math.random().toString(36).slice(2);
		const newToast: ToastData = {
			...props,
			id,
			duration: props.duration ?? 5000,
		};
		setToasts((prev) => [...prev, newToast]);

		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, newToast.duration);
	}, []);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

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
		<div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
			{toasts.map((t) => (
				<ToastItem key={t.id} toast={t} />
			))}
		</div>
	);
}

const toastStyles: Record<ToastType, string> = {
	success:
		"border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
	error: "border-destructive/50 bg-destructive/10 text-destructive",
	warning:
		"border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
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
				"pointer-events-auto flex w-full items-center gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-4",
				toastStyles[t.type],
			)}
		>
			<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs font-bold">
				{toastIcons[t.type]}
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium">{t.message}</p>
				{t.description && (
					<p className="text-xs opacity-80 mt-0.5">{t.description}</p>
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

export async function toast(props: Omit<ToastData, "id">) {
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
			"pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-4",
			toastStyles[props.type],
		);
		toastEl.innerHTML = `
			<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs font-bold">
				${toastIcons[props.type]}
			</span>
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium">${props.message}</p>
				${props.description ? `<p class="text-xs opacity-80 mt-0.5">${props.description}</p>` : ""}
			</div>
		`;
		container.appendChild(toastEl);

		setTimeout(() => {
			toastEl.remove();
		}, newToast.duration);
	}
}

export function Toaster() {
	return <div id="toast-root" />;
}
