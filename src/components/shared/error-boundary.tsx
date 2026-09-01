"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Catches render-time errors and shows a safe fallback instead of a blank
 * page or the raw error message.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected error occurred while loading this section. Please try again.
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}