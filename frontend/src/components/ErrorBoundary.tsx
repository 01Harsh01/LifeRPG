import React from "react";

interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Uncaught error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="card-glow p-8 max-w-sm">
            <p className="text-3xl mb-3">⚠️</p>
            <h1 className="font-display text-lg mb-2">Something went wrong.</h1>
            <p className="text-sm text-slate-400 mb-6">Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()} className="btn-primary w-full">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
