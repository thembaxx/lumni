"use client";

import React, { type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
	fallback?: ComponentType<{ error: Error; resetError: () => void }>;
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	public state: ErrorBoundaryState = {
		hasError: false,
		error: null,
	};

	public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// You can also log the error to an error reporting service
		console.error("Uncaught error:", error, errorInfo);
	}

	public resetError = () => {
		this.setState({ hasError: false, error: null });
	};

	public render() {
		if (this.state.hasError) {
			const FallbackComponent = this.props.fallback || ErrorFallback;
			return (
				<FallbackComponent
					error={this.state.error ?? new Error("Unknown error")}
					resetError={this.resetError}
				/>
			);
		}

		return this.props.children;
	}
}

const ErrorFallback: ComponentType<{
	error: Error;
	resetError: () => void;
}> = ({ error, resetError }) => {
	return (
		<div className="flex min-h-[20rem] flex-col items-center justify-center p-6">
			<h2 className="mb-4 text-foreground text-xl">Something went wrong.</h2>
			<p className="mb-6 max-w-xl text-center text-muted-foreground">
				{error?.message ?? "An unexpected error occurred."}
			</p>
			<Button onClick={resetError}>Try again</Button>
		</div>
	);
};

export default ErrorBoundary;
