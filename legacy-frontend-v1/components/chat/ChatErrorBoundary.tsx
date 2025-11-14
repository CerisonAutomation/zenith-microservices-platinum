/**
 * OMNIPRIME 15 Commandments - Chat Error Boundary
 * Absolute error handling and recovery for chat functionality
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastErrorTime: number;
}

export class ChatErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout = 5000; // 5 seconds

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Chat Error Boundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send to error reporting service (implement based on your service)
    this.reportError(error, errorInfo);

    this.setState({
      errorInfo,
      retryCount: this.state.retryCount + 1
    });
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Implement error reporting (Sentry, LogRocket, etc.)
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    // Send to your error reporting service
    console.log('Error Report:', errorReport);

    // Example: Send to Sentry or similar
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  };

  private handleRetry = () => {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;

    // Prevent rapid retries
    if (timeSinceLastError < this.retryTimeout) {
      return;
    }

    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0
    });
  };

  private handleGoHome = () => {
    window.location.href = '/'; // Or use your routing solution
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const timeSinceLastError = Date.now() - this.state.lastErrorTime;
      const canRetryNow = timeSinceLastError >= this.retryTimeout;

      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-amber-950 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-purple-900/50 backdrop-blur-xl border-amber-500/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <CardTitle className="text-amber-100">Chat Error</CardTitle>
              <CardDescription className="text-amber-200/70">
                Something went wrong with the chat system
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert className="bg-red-500/10 border-red-500/20">
                <Bug className="h-4 w-4 text-red-400" />
                <AlertTitle className="text-red-200">Error Details</AlertTitle>
                <AlertDescription className="text-red-300/80 text-sm">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {this.props.showErrorDetails && this.state.errorInfo && (
                <details className="bg-purple-800/30 rounded-lg p-3">
                  <summary className="text-amber-200 cursor-pointer text-sm font-medium">
                    Technical Details
                  </summary>
                  <pre className="text-xs text-amber-300/60 mt-2 whitespace-pre-wrap overflow-auto max-h-32">
                    {this.state.error?.stack}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col gap-2">
                {canRetry && canRetryNow ? (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                ) : canRetry && !canRetryNow ? (
                  <Button disabled className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying in {Math.ceil((this.retryTimeout - timeSinceLastError) / 1000)}s...
                  </Button>
                ) : null}

                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="w-full border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                >
                  Reset Chat
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="ghost"
                  className="w-full text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="text-center text-xs text-amber-300/50">
                Error #{this.state.retryCount} • {new Date(this.state.lastErrorTime).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to use error boundary
export const useChatErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Chat Error${context ? ` in ${context}` : ''}:`, error);

    // Could dispatch to error reporting service
    // Could also update global error state if needed
  };

  return { handleError };
};

// Higher-order component for wrapping chat components
export const withChatErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ChatErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ChatErrorBoundary>
  );

  WrappedComponent.displayName = `withChatErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default ChatErrorBoundary;