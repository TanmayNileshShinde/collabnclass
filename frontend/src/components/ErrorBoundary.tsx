import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20 backdrop-blur-md my-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {this.props.fallbackTitle || "Something went wrong in this module"}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">
            {this.props.fallbackMessage ||
              this.state.error?.message ||
              "An unexpected error occurred while rendering. You can try refreshing this section."}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
