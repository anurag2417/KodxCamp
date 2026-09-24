import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/shared/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Send to your monitoring service here (Sentry, LogRocket, etc.)
    console.error('Uncaught render error:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-bg p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)]">
              ⚠
            </div>
            <h1 className="mt-4 text-xl font-bold text-text-primary">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              An unexpected error occurred. Try reloading the page - if it keeps
              happening, contact support.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button onClick={this.reset} variant="secondary">
                Try again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
