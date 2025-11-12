/**
 * Error Boundary Component
 * Catches React errors and provides fallback UI
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AnalyticsService } from '@/services/api.service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to service
    console.error('Error caught by boundary:', error, errorInfo);

    // Track error in analytics
    AnalyticsService.trackEvent('error_boundary_triggered', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you would send this to an error tracking service like Sentry
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900/20 via-black to-pink-900/20 p-4">
          <Card className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border-2 border-red-500/30">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">Something went wrong</CardTitle>
                  <CardDescription className="text-gray-300">
                    We're sorry for the inconvenience
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h3 className="text-red-400 font-semibold mb-2">Error Details:</h3>
                  <pre className="text-sm text-red-300 overflow-auto max-h-48">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Go Home
                </Button>
              </div>

              <p className="text-sm text-gray-400 text-center">
                If the problem persists, please contact support
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary for suspense and async errors
 */
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-2 border-white/10">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Loading Error</h3>
              <p className="text-gray-300 mb-4">
                Failed to load this section. Please try refreshing.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
