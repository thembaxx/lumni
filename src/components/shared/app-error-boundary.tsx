"use client";

import { Component, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/shared/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackComponent?: ComponentType<{
    error: Error;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError("ErrorBoundary", error);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        const Fallback = this.props.fallbackComponent;
        return (
          <Fallback
            error={this.state.error ?? new Error("Unknown error")}
            resetError={this.resetError}
          />
        );
      }
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
          <h2 className="mb-2 font-semibold text-lg">Something went wrong</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            {this.state.error?.message ||
              "Something went wrong. Try again or contact support if this persists."}
          </p>
          <Button variant="outline" onClick={this.resetError}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
