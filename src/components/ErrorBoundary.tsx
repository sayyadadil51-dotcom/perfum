import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface State {
  error: Error | null;
}

/**
 * Catches unexpected render errors so a single broken screen never blanks the
 * whole app. Offers a reload plus a "clear demo data" escape hatch.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production you would forward this to Sentry / Logflare.
    // eslint-disable-next-line no-console
    console.error('[ScrapKart] Render error:', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            An unexpected error interrupted this screen. Your data is safe — reloading usually fixes it.
          </p>
        </div>
        <pre className="max-w-lg overflow-x-auto rounded-xl bg-muted px-3 py-2 text-left text-[11px] text-muted-foreground">
          {error.message}
        </pre>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Reload page
          </Button>
          <Button variant="outline" onClick={this.reset}>
            Try again
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              localStorage.removeItem('scrapkart.state.v1');
              window.location.href = '/';
            }}
          >
            Reset demo data
          </Button>
        </div>
      </div>
    );
  }
}
