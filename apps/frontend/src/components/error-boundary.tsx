'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { AnimatedButton } from './ui/animated-button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
          <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">
                  Something went wrong
                </h1>
                <p className="text-gray-400">
                  We're sorry, but something unexpected happened.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="w-full bg-gray-950 rounded-lg p-4 text-left">
                  <p className="text-xs font-mono text-red-400 break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3 w-full">
                <AnimatedButton
                  variant="primary"
                  className="flex-1"
                  onClick={this.handleReset}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Try Again
                </AnimatedButton>
                <AnimatedButton
                  variant="secondary"
                  className="flex-1"
                  onClick={() => (window.location.href = '/')}
                >
                  Go Home
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
