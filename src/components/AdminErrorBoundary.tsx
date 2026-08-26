import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Admin Panel Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-8 text-[#F8FAFC]">
          <div className="max-w-xl text-center space-y-4 p-8 border border-red-500/30 bg-red-500/10 rounded-2xl">
            <h2 className="text-xl font-bold text-red-400">Something went wrong on the Admin Panel.</h2>
            <p className="text-sm text-red-300/80 font-mono text-left bg-black/50 p-4 rounded-lg overflow-auto">
              {this.state.error?.toString()}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
