'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

// Error Boundary Component - Elite Error Handling
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to external service (in production)
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Report error to analytics/monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }

    // Send error report to backend
    this.reportError(error, errorInfo, errorId);
  }

  reportError = async (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    try {
      const errorReport = {
        errorId,
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId') || 'anonymous'
      };

      // Send to error reporting endpoint
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport)
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-5">
          <div className="max-w-2xl text-center bg-neutral-900 p-10 rounded-xl border border-neutral-800">
            {/* Error Icon */}
            <div className="text-6xl mb-6 text-red-500">
              ⚠️
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold mb-4 text-white">
              Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-base text-neutral-400 mb-8 leading-relaxed">
              We apologize for the inconvenience. Our team has been notified and is working to fix this issue.
            </p>

            {/* Error ID for support */}
            <div className="bg-neutral-800 p-3 rounded-lg mb-6 font-mono text-sm text-neutral-400">
              Error ID: {errorId}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center flex-wrap mb-8">
              <Button
                variant="default"
                onClick={this.handleRetry}
                className="min-w-[120px]"
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={this.handleReload}
                className="min-w-[120px]"
              >
                Reload Page
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="min-w-[120px]"
              >
                Go Back
              </Button>
            </div>

            {/* Support Information */}
            <Alert className="bg-neutral-800 border-neutral-700">
              <AlertTitle className="text-lg font-semibold mb-3 text-white">
                Need Help?
              </AlertTitle>
              <AlertDescription className="text-sm text-neutral-400 mb-4">
                Contact our support team with the error ID above for faster assistance.
              </AlertDescription>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button variant="link" asChild className="text-blue-400 border border-blue-400 rounded-md px-4 py-2 text-sm">
                  <a href="mailto:support@zenith.com">
                    Email Support
                  </a>
                </Button>
                <Button variant="link" asChild className="text-blue-400 border border-blue-400 rounded-md px-4 py-2 text-sm">
                  <a href="/help">
                    Help Center
                  </a>
                </Button>
              </div>
            </Alert>

            {/* Development Error Details */}
            {isDevelopment && error && errorInfo && (
              <details className="mt-6 text-left bg-neutral-800 p-4 rounded-lg">
                <summary className="cursor-pointer font-semibold text-white mb-3">
                  Development Error Details
                </summary>
                <div className="bg-neutral-950 p-3 rounded-md font-mono text-xs text-red-400 overflow-auto max-h-[200px]">
                  <div className="mb-3">
                    <strong>Error:</strong> {error.toString()}
                  </div>
                  <div className="mb-3">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap my-2">
                      {error.stack}
                    </pre>
                  </div>
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap my-2">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component - Elite Loading States
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string | null;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text = null,
  fullScreen = false
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerClasses = fullScreen
    ? 'fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-neutral-950/80 z-[9999] flex-col gap-4'
    : 'flex items-center justify-center flex-col gap-3';

  return (
    <div className={containerClasses}>
      <div className={`${sizeClasses[size]} border-[3px] border-neutral-800 border-t-yellow-500 rounded-full animate-spin`} />
      {text && (
        <p className="m-0 text-neutral-400 text-sm text-center">
          {text}
        </p>
      )}
    </div>
  );
};

// Suspense Fallback Component
export const SuspenseFallback: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <LoadingSpinner fullScreen text={message} />
);

// Global Error Handler Hook
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo: React.ErrorInfo | null = null) => {
    console.error('Error handled by hook:', error, errorInfo);

    // Report to error tracking service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }

    // You can also send to your error reporting service here
  }, []);

  return handleError;
};

export default ErrorBoundary;
